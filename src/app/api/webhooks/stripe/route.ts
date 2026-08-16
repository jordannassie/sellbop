import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { calcPlatformFeeCents } from '@/lib/platform-config'

// POST /api/webhooks/stripe — Stripe webhook endpoint
// ── STRIPE INTEGRATION POINT ──────────────────────────────────────────────────
// This route is prepared but requires Stripe credentials to activate.
// See STRIPE-INTEGRATION-HANDOFF.md for complete setup instructions.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!env.stripe.webhookSecret || !env.stripe.secretKey) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'No Stripe signature.' }, { status: 400 })
  }

  // ── WEBHOOK SIGNATURE VERIFICATION ────────────────────────────────────────
  // import Stripe from 'stripe'
  // const stripe = new Stripe(env.stripe.secretKey)
  // let event: Stripe.Event
  // try {
  //   event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret)
  // } catch (err) {
  //   return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // ── EVENT HANDLERS ────────────────────────────────────────────────────────
  //
  // switch (event.type) {
  //
  //   case 'checkout.session.completed': {
  //     const session = event.data.object as Stripe.Checkout.Session
  //     await handleCheckoutCompleted(session)
  //     break
  //   }
  //
  //   case 'payment_intent.payment_failed': {
  //     // Update order payment_status = 'failed'
  //     break
  //   }
  //
  //   case 'charge.refunded': {
  //     // Update order: payment_status = 'refunded', refund_status = 'refunded'
  //     // Revoke purchase entitlement
  //     break
  //   }
  //
  //   case 'charge.dispute.created': {
  //     // Update order: refund_status = 'pending'
  //     break
  //   }
  //
  //   case 'account.updated': {
  //     // Update store: stripe_charges_enabled, stripe_payouts_enabled
  //     break
  //   }
  // }
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ received: true, stripe_required: true })
}

/**
 * Handle a completed Stripe Checkout Session.
 * Creates the order, order items, and purchase entitlement.
 * Called from the webhook handler once Stripe is configured.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleCheckoutCompleted(session: {
  id: string
  customer_email?: string | null
  payment_intent?: string | null
  metadata?: Record<string, string>
  amount_total?: number | null
}) {
  if (!isSupabaseAdminConfigured()) return

  const admin = getSupabaseAdminClient()
  const meta = session.metadata ?? {}
  const productId = meta.sellbop_product_id
  const storeId = meta.sellbop_store_id
  const buyerEmail = meta.buyer_email ?? session.customer_email
  const buyerName = meta.buyer_name ?? null
  const discountCents = parseInt(meta.discount_cents ?? '0')

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
      stripe_payment_intent_id: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null,
      product_id: productId,
      product_title_snapshot: product.title,
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
}
