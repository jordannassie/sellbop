import 'server-only'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env, isSupabaseAdminConfigured } from '@/lib/env'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'
import { fulfillFromStripeSession } from '@/lib/services/purchase-fulfillment'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required.' }, { status: 400 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ status: 'processing' })
  }

  const admin = getSupabaseAdminClient()

  let order = null as {
    id: string
    buyer_email: string | null
    buyer_name: string | null
    total_cents: number | null
    product_title_snapshot: string | null
    payment_status: string | null
  } | null

  const { data: existingOrder } = await admin
    .from('orders')
    .select('id, buyer_email, buyer_name, total_cents, product_title_snapshot, payment_status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  order = existingOrder

  if (!order && env.stripe.secretKey) {
    const stripe = new Stripe(env.stripe.secretKey)
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await fulfillFromStripeSession(session)
        const { data: created } = await admin
          .from('orders')
          .select('id, buyer_email, buyer_name, total_cents, product_title_snapshot, payment_status')
          .eq('stripe_session_id', sessionId)
          .maybeSingle()
        order = created
      } else if (session.payment_status === 'unpaid') {
        return NextResponse.json({ status: 'processing' })
      }
    } catch {
      return NextResponse.json({ status: 'processing' })
    }
  }

  if (!order) {
    return NextResponse.json({ status: 'processing' })
  }

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, access_token, status')
    .eq('order_id', order.id)
    .maybeSingle()

  if (!purchase?.access_token || purchase.status !== 'active') {
    return NextResponse.json({ status: 'processing' })
  }

  const { data: receiptDelivery } = await admin
    .from('transactional_email_deliveries')
    .select('status')
    .eq('event_key', `purchase-receipt/${order.id}`)
    .maybeSingle()

  const emailSent = receiptDelivery
    ? ['accepted', 'sent', 'delivered', 'simulated'].includes(receiptDelivery.status)
    : false

  return NextResponse.json({
    status: 'completed',
    productTitle: order.product_title_snapshot,
    buyerEmail: order.buyer_email,
    accessUrl: getPurchaseAccessUrl(purchase.access_token),
    emailSent,
    emailSimulated: receiptDelivery?.status === 'simulated',
  })
}
