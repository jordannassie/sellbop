import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { calcPlatformFeeCents } from '@/lib/platform-config'
import { calcCommissionCents, calcAvailableAt } from '@/lib/affiliates'

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
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
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
      if (isSupabaseAdminConfigured() && paymentIntentId) {
        const admin = getSupabaseAdminClient()
        const { data: order } = await admin
          .from('orders')
          .update({ payment_status: 'refunded', refund_status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId)
          .select('id, affiliate_commission_id')
          .maybeSingle()

        if (order) {
          await admin.from('purchases').update({ status: 'revoked' }).eq('order_id', order.id)

          if (order.affiliate_commission_id) {
            await admin
              .from('affiliate_commissions')
              .update({ status: 'reversed', reversed_at: new Date().toISOString(), reversal_reason: 'order_refunded' })
              .eq('id', order.affiliate_commission_id)
          }
        }
      }
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

  return NextResponse.json({ received: true })
}

/**
 * Handle a completed Stripe Checkout Session.
 * Creates the order, order items, purchase entitlement, and — if the
 * checkout carried affiliate attribution — a pending affiliate commission.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!isSupabaseAdminConfigured()) return

  const admin = getSupabaseAdminClient()
  const meta = session.metadata ?? {}
  const productId = meta.sellbop_product_id
  const storeId = meta.sellbop_store_id
  const buyerEmail = meta.buyer_email ?? session.customer_email
  const buyerName = meta.buyer_name ?? null
  const discountCents = parseInt(meta.discount_cents ?? '0')
  const affiliateRelationshipId = meta.affiliate_relationship_id || null
  const affiliateCommissionPercent = meta.affiliate_commission_percent
    ? parseInt(meta.affiliate_commission_percent)
    : 0

  if (!productId || !storeId || !buyerEmail) return

  // Idempotency check
  const { data: existingOrder } = await admin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existingOrder) return  // Already processed

  const { data: product } = await admin
    .from('products')
    .select('id, title, price_cents')
    .eq('id', productId)
    .maybeSingle()

  if (!product) return

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', storeId)
    .maybeSingle()

  if (!store) return

  const totalCents = session.amount_total ?? product.price_cents ?? 0
  const platformFeeCents = calcPlatformFeeCents(totalCents)
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  const { data: order } = await admin
    .from('orders')
    .insert({
      store_id: storeId,
      seller_user_id: store.owner_user_id,
      buyer_email: buyerEmail.toLowerCase(),
      buyer_name: buyerName,
      subtotal_cents: (product.price_cents ?? 0),
      shipping_cents: 0,
      total_cents: totalCents,
      discount_cents: discountCents,
      platform_fee_cents: platformFeeCents,
      currency: 'usd',
      status: 'completed',
      payment_status: 'paid',
      refund_status: 'none',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      product_id: productId,
      product_title_snapshot: product.title,
      affiliate_relationship_id: affiliateRelationshipId,
    })
    .select('id')
    .single()

  if (!order) return

  // Order item
  await admin.from('order_items').insert({
    order_id: order.id,
    product_id: productId,
    title: product.title,
    quantity: 1,
    unit_price_cents: product.price_cents ?? 0,
    line_total_cents: totalCents,
  })

  // Purchase entitlement
  await admin.from('purchases').insert({
    buyer_email: buyerEmail.toLowerCase(),
    product_id: productId,
    order_id: order.id,
    status: 'active',
    affiliate_relationship_id: affiliateRelationshipId,
  })

  // Increment discount code usage if applicable
  if (meta.discount_code_id) {
    try {
      await admin.rpc('increment_discount_code_usage' as never, {
        code_id: meta.discount_code_id,
      } as never)
    } catch {
      // Best-effort — non-blocking
    }
  }

  // Affiliate commission — pending until the hold period elapses
  if (affiliateRelationshipId && affiliateCommissionPercent > 0) {
    const { data: relationship } = await admin
      .from('affiliate_relationships')
      .select('id, affiliate_user_id, seller_id, status')
      .eq('id', affiliateRelationshipId)
      .maybeSingle()

    if (relationship && relationship.status === 'active') {
      const commissionCents = calcCommissionCents(totalCents, affiliateCommissionPercent)

      const { data: commission } = await admin
        .from('affiliate_commissions')
        .insert({
          relationship_id: relationship.id,
          affiliate_user_id: relationship.affiliate_user_id,
          seller_id: relationship.seller_id,
          product_id: productId,
          order_id: order.id,
          gross_sale_cents: totalCents,
          commission_percent: affiliateCommissionPercent,
          commission_cents: commissionCents,
          currency: 'usd',
          status: 'pending',
          available_at: calcAvailableAt().toISOString(),
        })
        .select('id')
        .single()

      if (commission) {
        await admin.from('orders').update({ affiliate_commission_id: commission.id }).eq('id', order.id)
      }
    }
  }
}
