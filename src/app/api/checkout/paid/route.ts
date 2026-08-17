import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { calcPlatformFeeCents } from '@/lib/platform-config'

interface PaidCheckoutPayload {
  productSlug: string
  buyerEmail: string
  buyerName?: string
  discountCode?: string
  /** Affiliate referral code, if the buyer arrived via an affiliate link
   *  (?ref=CODE) during this browsing session. Same-session attribution
   *  only for now — see AFFILIATE-TRACKING.md for the cross-session upgrade path. */
  refCode?: string
}

// POST /api/checkout/paid — initiate Stripe Checkout Session
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  let body: PaidCheckoutPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { productSlug, buyerEmail, buyerName, discountCode, refCode } = body
  if (!productSlug?.trim() || !buyerEmail?.trim()) {
    return NextResponse.json({ error: 'productSlug and buyerEmail are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(buyerEmail)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  // Load product — server-side price; NEVER trust client
  const { data: product } = await admin
    .from('products')
    .select('id, store_id, title, price_cents, is_live, product_type, affiliate_enabled, affiliate_commission_percent')
    .eq('slug', productSlug.trim())
    .maybeSingle()

  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (!product.is_live) return NextResponse.json({ error: 'Product is not available.' }, { status: 400 })

  const priceCents = product.price_cents ?? 0
  if (priceCents <= 0) {
    return NextResponse.json({ error: 'Use /api/checkout/free for free products.' }, { status: 400 })
  }

  // Load store
  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id, stripe_account_id, stripe_charges_enabled')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 500 })

  if (!store.stripe_account_id || !store.stripe_charges_enabled) {
    return NextResponse.json({
      error: 'This seller has not finished connecting their Stripe account yet.',
    }, { status: 400 })
  }

  // Apply discount code (server-side)
  let discountCents = 0
  let discountCodeId: string | null = null
  if (discountCode?.trim()) {
    const { data: code } = await admin
      .from('discount_codes')
      .select('*')
      .eq('store_id', store.id)
      .ilike('code', discountCode.trim())
      .eq('active', true)
      .maybeSingle()

    if (code) {
      const now = new Date()
      const expired = code.expires_at && new Date(code.expires_at) < now
      const exhausted = code.max_uses !== null && code.used_count >= code.max_uses
      const wrongProduct = code.product_id && code.product_id !== product.id

      if (!expired && !exhausted && !wrongProduct) {
        discountCents = code.discount_type === 'percent'
          ? Math.round(priceCents * (code.discount_value / 100))
          : Math.min(code.discount_value, priceCents)
        discountCodeId = code.id
      }
    }
  }

  const totalCents = Math.max(0, priceCents - discountCents)
  const platformFeeCents = calcPlatformFeeCents(totalCents)
  const appUrl = env.app.url

  // Resolve affiliate attribution — same-session only: the referral code
  // must have been present in the URL for this exact checkout call. If it
  // matches an active relationship for this product, we record it on the
  // order and the webhook creates a pending commission for the affiliate.
  let affiliateRelationshipId: string | null = null
  let affiliateCommissionPercent: number | null = null
  if (refCode?.trim() && product.affiliate_enabled) {
    const { data: relationship } = await admin
      .from('affiliate_relationships')
      .select('id, affiliate_user_id, product_id, seller_id, status')
      .eq('referral_code', refCode.trim().toUpperCase())
      .eq('product_id', product.id)
      .eq('status', 'active')
      .maybeSingle()

    if (relationship) {
      affiliateRelationshipId = relationship.id
      affiliateCommissionPercent = product.affiliate_commission_percent ?? 0
    }
  }

  if (!env.stripe.secretKey) {
    return NextResponse.json({
      stripe_required: true,
      message: 'Stripe Connect is not yet activated. See STRIPE-INTEGRATION-HANDOFF.md.',
      product_id: product.id,
      product_title: product.title,
      price_cents: priceCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      platform_fee_cents: platformFeeCents,
    }, { status: 503 })
  }

  const stripe = new Stripe(env.stripe.secretKey)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: buyerEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: totalCents,
        product_data: { name: product.title },
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: store.stripe_account_id },
    },
    metadata: {
      sellbop_product_id: product.id,
      sellbop_product_slug: productSlug,
      sellbop_store_id: store.id,
      buyer_email: buyerEmail,
      buyer_name: buyerName ?? '',
      discount_code_id: discountCodeId ?? '',
      discount_cents: String(discountCents),
      affiliate_relationship_id: affiliateRelationshipId ?? '',
      affiliate_commission_percent: affiliateCommissionPercent !== null ? String(affiliateCommissionPercent) : '',
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/p/${productSlug}`,
  })

  return NextResponse.json({ checkout_url: session.url })
}
