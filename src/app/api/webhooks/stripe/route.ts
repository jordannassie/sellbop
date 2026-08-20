import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { fulfillFromStripeSession } from '@/lib/services/purchase-fulfillment'
import { sendRefundEmail } from '@/lib/email/service'
import { processPartnerRefund } from '@/lib/payments/partner-settlement'

async function claimStripeWebhookEvent(event: Stripe.Event): Promise<'process' | 'skip'> {
  if (!isSupabaseAdminConfigured()) return 'process'
  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'processing',
  })
  if (error?.code === '23505') return 'skip'
  if (error?.code === 'PGRST205' || (error?.message?.includes('schema cache') ?? false)) return 'process'
  if (error) {
    console.error('[stripe webhook] event claim failed', event.id, error.message)
    return 'process'
  }
  return 'process'
}

async function markStripeWebhookEvent(eventId: string, status: 'processed' | 'failed', lastError?: string) {
  if (!isSupabaseAdminConfigured()) return
  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('stripe_webhook_events').update({
    status,
    processed_at: status === 'processed' ? new Date().toISOString() : null,
    last_error: lastError ?? null,
  }).eq('stripe_event_id', eventId)
  if (error?.code === 'PGRST205' || (error?.message?.includes('schema cache') ?? false)) return
}

// POST /api/webhooks/stripe — Stripe webhook endpoint
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!env.stripe.webhookSecret || !env.stripe.secretKey) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'No Stripe signature.' }, { status: 400 })
  }

  const stripe = new Stripe(env.stripe.secretKey)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const claim = await claimStripeWebhookEvent(event)
  if (claim === 'skip') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await fulfillFromStripeSession(session)
      }
      break
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      await fulfillFromStripeSession(session)
      break
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (isSupabaseAdminConfigured()) {
        const admin = getSupabaseAdminClient()
        await admin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('stripe_session_id', session.id)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      if (isSupabaseAdminConfigured()) {
        const admin = getSupabaseAdminClient()
        await admin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('stripe_payment_intent_id', intent.id)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      await handleChargeRefunded(charge)
      break
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : null
      if (isSupabaseAdminConfigured() && paymentIntentId) {
        const admin = getSupabaseAdminClient()
        await admin
          .from('orders')
          .update({ refund_status: 'disputed' })
          .eq('stripe_payment_intent_id', paymentIntentId)
      }
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (isSupabaseAdminConfigured()) {
        const admin = getSupabaseAdminClient()
        await admin
          .from('stores')
          .update({
            stripe_charges_enabled: !!account.charges_enabled,
            stripe_payouts_enabled: !!account.payouts_enabled,
            stripe_onboarding_complete: !!(account.details_submitted && account.charges_enabled),
          })
          .eq('stripe_account_id', account.id)
      }
      break
    }
  }

  await markStripeWebhookEvent(event.id, 'processed')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler failed'
    console.error('[stripe webhook]', event.type, event.id, message)
    await markStripeWebhookEvent(event.id, 'failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!isSupabaseAdminConfigured()) return
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
  if (!paymentIntentId) return

  const admin = getSupabaseAdminClient()
  const amountRefunded = charge.amount_refunded ?? 0
  const totalAmount = charge.amount ?? 0
  const isFullRefund = amountRefunded >= totalAmount && totalAmount > 0

  const { data: order } = await admin
    .from('orders')
    .select(`
      id, buyer_email, buyer_name, total_cents, product_title_snapshot, product_id,
      affiliate_commission_id, store_id
    `)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (!order) return

  try {
    await processPartnerRefund({
      orderId: order.id,
      refundCents: amountRefunded,
      stripeRefundId: charge.id,
      isFullRefund,
    })
  } catch (partnerRefundErr) {
    console.error('[handleChargeRefunded] partner refund', order.id, partnerRefundErr)
  }

  await admin.from('orders').update({
    refunded_cents: amountRefunded,
    payment_status: isFullRefund ? 'refunded' : 'paid',
    refund_status: isFullRefund ? 'refunded' : 'partially_refunded',
  }).eq('id', order.id)

  if (isFullRefund) {
    await admin.from('purchases').update({ status: 'revoked' }).eq('order_id', order.id)

    if (order.affiliate_commission_id) {
      await admin
        .from('affiliate_commissions')
        .update({
          status: 'reversed',
          reversed_at: new Date().toISOString(),
          reversal_reason: 'order_refunded',
        })
        .eq('id', order.affiliate_commission_id)
    }
  }

  const { data: store } = await admin
    .from('stores')
    .select('name, support_email')
    .eq('id', order.store_id)
    .maybeSingle()

  const { data: purchase } = await admin
    .from('purchases')
    .select('id')
    .eq('order_id', order.id)
    .maybeSingle()

  if (order.buyer_email) {
    await sendRefundEmail({
      to: order.buyer_email,
      replyTo: store?.support_email ?? env.email.supportEmail,
      orderId: order.id,
      purchaseId: purchase?.id,
      buyerName: order.buyer_name,
      productTitle: order.product_title_snapshot ?? 'Product',
      sellerName: store?.name ?? 'Seller',
      refundCents: amountRefunded,
      totalCents: order.total_cents ?? totalAmount,
      isPartial: !isFullRefund,
      supportEmail: store?.support_email ?? env.email.supportEmail,
      refundId: charge.id,
    })
  }
}
