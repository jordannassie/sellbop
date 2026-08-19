import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { fulfillPurchase } from '@/lib/services/purchase-fulfillment'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'

interface FreeCheckoutPayload {
  productSlug: string
  buyerEmail: string
  buyerName?: string
}

// POST /api/checkout/free — process a free ($0) product acquisition
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  let body: FreeCheckoutPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { productSlug, buyerEmail, buyerName } = body
  if (!productSlug?.trim() || !buyerEmail?.trim()) {
    return NextResponse.json({ error: 'productSlug and buyerEmail are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(buyerEmail)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const normalizedEmail = buyerEmail.toLowerCase().trim()

  const { data: product, error: productErr } = await admin
    .from('products')
    .select('id, store_id, title, price_cents, is_live')
    .eq('slug', productSlug.trim())
    .maybeSingle()

  if (productErr) return NextResponse.json({ error: productErr.message }, { status: 500 })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (!product.is_live) return NextResponse.json({ error: 'Product is not available.' }, { status: 400 })

  const priceCents = product.price_cents ?? 0
  if (priceCents > 0) {
    return NextResponse.json({ error: 'This product requires payment.' }, { status: 400 })
  }

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 500 })

  const { getPartnershipByStoreId } = await import('@/lib/partnerships/queries')
  const { canStoreAcceptCheckout } = await import('@/lib/partnerships/publication')
  const partnership = await getPartnershipByStoreId(store.id)
  if (!canStoreAcceptCheckout(partnership)) {
    return NextResponse.json({ error: 'This shop is not accepting purchases yet.' }, { status: 403 })
  }

  const { data: existing } = await admin
    .from('purchases')
    .select('id, order_id, access_token')
    .eq('buyer_email', normalizedEmail)
    .eq('product_id', product.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existing?.access_token) {
    return NextResponse.json({
      already_acquired: true,
      order_id: existing.order_id,
      purchase_id: existing.id,
      product_id: product.id,
      product_slug: productSlug,
      access_url: getPurchaseAccessUrl(existing.access_token),
      email_sent: false,
    })
  }

  const result = await fulfillPurchase({
    productId: product.id,
    storeId: store.id,
    sellerUserId: store.owner_user_id,
    productTitle: product.title,
    buyerEmail: normalizedEmail,
    buyerName: buyerName?.trim() || null,
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
    platformFeeCents: 0,
    paymentStatus: 'paid',
  })

  if (!result) {
    return NextResponse.json({ error: 'Failed to complete acquisition.' }, { status: 500 })
  }

  return NextResponse.json({
    order_id: result.orderId,
    purchase_id: result.purchaseId,
    product_id: product.id,
    product_slug: productSlug,
    access_url: result.accessUrl,
    email_sent: !!result.emails.receipt?.sent || !!result.emails.receipt?.simulated,
    email_accepted: !!result.emails.receipt?.accepted,
  }, { status: 201 })
}
