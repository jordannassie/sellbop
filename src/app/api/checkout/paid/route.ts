import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { calculateTransactionFees } from '@/lib/platform-config'
import { resolveSaleType } from '@/lib/checkout/sale-source'
import { getEffectiveProductPrice } from '@/lib/pricing/product-price'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { canStoreAcceptCheckout } from '@/lib/partnerships/publication'
import { fulfillPurchase } from '@/lib/services/purchase-fulfillment'

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
    .select('id, store_id, title, slug, price_cents, sale_enabled, sale_price_cents, sale_ends_at, is_live, product_type, affiliate_enabled, affiliate_commission_percent, marketplace_listing')
    .eq('slug', productSlug.trim())
    .maybeSingle()

  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (!product.is_live) return NextResponse.json({ error: 'Product is not available.' }, { status: 400 })

  const pricing = getEffectiveProductPrice(product)
  const priceCents = pricing.effectivePriceCents
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

  const partnership = await getPartnershipByStoreId(store.id)
  if (!canStoreAcceptCheckout(partnership)) {
    return NextResponse.json({ error: 'This Shop is not available for checkout yet.' }, { status: 403 })
  }

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

  // Resolve affiliate attribution before fee calculation / Stripe
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

  const saleType = resolveSaleType({
    productSlug: product.slug ?? productSlug.trim(),
    marketplaceListing: product.marketplace_listing ?? false,
    request,
  })
  const fees = calculateTransactionFees({
    grossAmountCents: totalCents,
    saleType,
    affiliateCommissionPercent: affiliateCommissionPercent ?? 0,
  })
  const platformFeeCents = fees.sellbopPlatformFeeCents
  const appUrl = env.app.url

  // 100% discount → free fulfillment path (no Stripe $0 line item)
  if (totalCents === 0) {
    const result = await fulfillPurchase({
      productId: product.id,
      storeId: store.id,
      sellerUserId: store.owner_user_id,
      productTitle: product.title,
      buyerEmail: buyerEmail.trim(),
      buyerName: buyerName?.trim() || null,
      subtotalCents: priceCents,
      discountCents,
      totalCents: 0,
      platformFeeCents: 0,
      saleType,
      paymentStatus: 'paid',
      affiliateRelationshipId,
      affiliateCommissionPercent: affiliateCommissionPercent ?? 0,
      discountCodeId,
    })

    if (!result) {
      return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 })
    }

    return NextResponse.json({
      free_checkout: true,
      order_id: result.orderId,
      purchase_id: result.purchaseId,
      product_id: product.id,
      product_slug: productSlug,
      access_url: result.accessUrl,
      email_sent: !!result.emails.receipt?.sent || !!result.emails.receipt?.simulated,
      email_accepted: !!result.emails.receipt?.accepted,
    })
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
      subtotal_cents: String(priceCents),
      affiliate_relationship_id: affiliateRelationshipId ?? '',
      affiliate_commission_percent: affiliateCommissionPercent !== null ? String(affiliateCommissionPercent) : '',
      platform_fee_cents: String(platformFeeCents),
      sale_source: saleType,
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/p/${productSlug}`,
  })

  return NextResponse.json({ checkout_url: session.url })
}
