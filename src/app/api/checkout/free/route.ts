import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'

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

  // Load product — server-side; never trust client price
  const { data: product, error: productErr } = await admin
    .from('products')
    .select('id, store_id, title, price_cents, is_live, product_type')
    .eq('slug', productSlug.trim())
    .maybeSingle()

  if (productErr) return NextResponse.json({ error: productErr.message }, { status: 500 })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (!product.is_live) return NextResponse.json({ error: 'Product is not available.' }, { status: 400 })

  // Verify it's actually free (server enforced)
  const priceCents = product.price_cents ?? 0
  if (priceCents > 0) {
    return NextResponse.json({ error: 'This product requires payment.' }, { status: 400 })
  }

  // Find the store/seller through the product's store_id
  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 500 })

  // Check for duplicate acquisition
  const { data: existing } = await admin
    .from('purchases')
    .select('id')
    .eq('buyer_email', buyerEmail.toLowerCase())
    .eq('product_id', product.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ already_acquired: true, purchase_id: existing.id })
  }

  // Determine which columns orders table supports (resilient to unapplied migrations)
  type OrderInsert = {
    store_id: string
    seller_user_id: string
    buyer_email: string
    buyer_name: string | null
    subtotal_cents: number
    shipping_cents: number
    total_cents: number
    status: string
    payment_status: string
    product_id?: string
    product_title_snapshot?: string
    discount_cents?: number
    platform_fee_cents?: number
    currency?: string
    refund_status?: string
  }

  const orderInsert: OrderInsert = {
    store_id: store.id,
    seller_user_id: store.owner_user_id,
    buyer_email: buyerEmail.toLowerCase().trim(),
    buyer_name: buyerName?.trim() ?? null,
    subtotal_cents: 0,
    shipping_cents: 0,
    total_cents: 0,
    status: 'completed',
    payment_status: 'paid',
  }

  // Try to insert with extended columns (available after migration 011)
  let order: { id: string } | null = null
  const extendedInsert = {
    ...orderInsert,
    product_id: product.id,
    product_title_snapshot: product.title,
    discount_cents: 0,
    platform_fee_cents: 0,
    currency: 'usd',
    refund_status: 'none',
  }

  const { data: orderData, error: orderErr } = await admin
    .from('orders')
    .insert(extendedInsert)
    .select('id')
    .single()

  if (orderErr) {
    // If extended columns don't exist yet, fall back to minimal insert
    if (orderErr.message.includes('column') && orderErr.message.includes('does not exist')) {
      const { data: fallback, error: fallbackErr } = await admin
        .from('orders')
        .insert(orderInsert)
        .select('id')
        .single()
      if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
      order = fallback
    } else {
      return NextResponse.json({ error: orderErr.message }, { status: 500 })
    }
  } else {
    order = orderData
  }

  if (!order) return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })

  // Create order item
  await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    title: product.title,
    quantity: 1,
    unit_price_cents: 0,
    line_total_cents: 0,
  })

  // Create purchase entitlement — resilient to missing 'status' column
  type PurchaseInsert = {
    buyer_email: string
    product_id: string
    order_id: string
    status?: string
  }
  const purchaseInsert: PurchaseInsert = {
    buyer_email: buyerEmail.toLowerCase().trim(),
    product_id: product.id,
    order_id: order.id,
    status: 'active',
  }

  let purchase: { id: string } | null = null
  const { data: purchaseData, error: purchaseErr } = await admin
    .from('purchases')
    .insert(purchaseInsert)
    .select('id')
    .single()

  if (purchaseErr) {
    if (purchaseErr.message.includes('column') && purchaseErr.message.includes('does not exist')) {
      const { data: pFallback, error: pFallbackErr } = await admin
        .from('purchases')
        .insert({ buyer_email: buyerEmail.toLowerCase().trim(), product_id: product.id, order_id: order.id })
        .select('id')
        .single()
      if (pFallbackErr) return NextResponse.json({ error: pFallbackErr.message }, { status: 500 })
      purchase = pFallback
    } else {
      return NextResponse.json({ error: purchaseErr.message }, { status: 500 })
    }
  } else {
    purchase = purchaseData
  }

  if (!purchase) return NextResponse.json({ error: 'Failed to create purchase.' }, { status: 500 })

  return NextResponse.json({
    order_id: order.id,
    purchase_id: purchase.id,
    product_id: product.id,
    product_slug: productSlug,
  }, { status: 201 })
}
