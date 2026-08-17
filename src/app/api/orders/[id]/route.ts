import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

// GET /api/orders/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()

  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const { data: order, error } = await admin
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('store_id', store.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const { data: items } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  return NextResponse.json({ order, items: items ?? [] })
}

// POST /api/orders/[id]/refund — initiate a refund via Stripe
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  if (!url.pathname.endsWith('/refund')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()

  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const { data: order } = await admin
    .from('orders')
    .select('id, store_id, stripe_payment_intent_id, payment_status, total_cents')
    .eq('id', id)
    .eq('store_id', store.id)
    .maybeSingle()

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Order is not paid.' }, { status: 400 })
  }
  if (!order.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'No payment on this order to refund.' }, { status: 400 })
  }

  if (!env.stripe.secretKey) {
    return NextResponse.json({
      error: 'Stripe not yet connected. Refund capability requires Stripe integration.',
      stripe_required: true,
    }, { status: 501 })
  }

  const stripe = new Stripe(env.stripe.secretKey)

  try {
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Stripe refund failed.',
    }, { status: 502 })
  }

  // The charge.refunded webhook will also fire and update these fields —
  // this is set here too so the seller's UI reflects it immediately rather
  // than waiting on the webhook round trip.
  await admin
    .from('orders')
    .update({ payment_status: 'refunded', refund_status: 'refunded' })
    .eq('id', order.id)

  await admin
    .from('purchases')
    .update({ status: 'revoked' })
    .eq('order_id', order.id)

  return NextResponse.json({ ok: true })
}
