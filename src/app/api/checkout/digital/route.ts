import { NextResponse } from 'next/server'
import { DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

interface CheckoutPayload {
  productId: string
  buyerName: string
  buyerEmail: string
  subtotalCents: number
  totalCents: number
}

type LiveProduct = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'store_id' | 'title' | 'product_type'
>

type LiveStore = Pick<
  Database['public']['Tables']['stores']['Row'],
  'id' | 'owner_user_id'
>

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutPayload
  const demoProduct = DEMO_PRODUCTS.find((product) => product.id === body.productId)

  if (!demoProduct) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  }

  const admin = getSupabaseAdminClient()
  const userClient = await getSupabaseServerClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()

  const { data: productRow, error: productError } = await admin
    .from('products')
    .select('id,store_id,title,product_type')
    .eq('slug', demoProduct.slug)
    .maybeSingle()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  let product = productRow as LiveProduct | null

  if (!product) {
    // Force Supabase record creation for demo products to avoid demo-fallback
    let { data: storeRow } = await admin
      .from('stores')
      .select('id, owner_user_id')
      .eq('slug', 'demo-seller')
      .maybeSingle()

    if (!storeRow) {
      // Try to find ANY store to attach the product to (useful for guest testing)
      const { data: anyStore } = await admin
        .from('stores')
        .select('id, owner_user_id')
        .limit(1)
        .maybeSingle()
        
      if (anyStore) {
        storeRow = anyStore
      } else if (user) {
        // If no store exists at all, create one if we have an authenticated user
        const { data: newStore, error: storeCreateErr } = await admin
          .from('stores')
          .insert({
            slug: 'demo-seller',
            name: 'Demo Seller',
            owner_user_id: user.id, // assign to the buyer for demo purposes
          })
          .select('id, owner_user_id')
          .single()

        if (!storeCreateErr && newStore) {
          storeRow = newStore
        }
      }
    }

    if (storeRow) {
      const { data: newProduct } = await admin
        .from('products')
        .insert({
          store_id: storeRow.id,
          title: demoProduct.name,
          slug: demoProduct.slug,
          product_type: demoProduct.productType,
          price_cents: demoProduct.price,
          is_live: true,
        })
        .select('id,store_id,title,product_type')
        .single()

      if (newProduct) {
        product = newProduct as LiveProduct
      }
    }
  }

  if (!product) {
    return NextResponse.json({ mode: 'demo-fallback' }, { status: 200 })
  }

  const { data: storeRow, error: storeError } = await admin
    .from('stores')
    .select('id,owner_user_id')
    .eq('id', product.store_id)
    .single()

  if (storeError) {
    return NextResponse.json({ error: storeError.message }, { status: 500 })
  }

  const store = storeRow as LiveStore

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      store_id: store.id,
      buyer_user_id: user?.id ?? null,
      seller_user_id: store.owner_user_id,
      buyer_name: body.buyerName,
      buyer_email: body.buyerEmail,
      subtotal_cents: body.subtotalCents,
      total_cents: body.totalCents,
      payment_status: 'paid',
      status: 'paid',
    })
    .select('id')
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const lineItemResult = await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    title: product.title,
    quantity: 1,
    unit_price_cents: body.subtotalCents,
    line_total_cents: body.totalCents,
  })

  if (lineItemResult.error) {
    return NextResponse.json({ error: lineItemResult.error.message }, { status: 500 })
  }

  const purchaseResult = await admin.from('purchases').insert({
    buyer_user_id: user?.id ?? null,
    buyer_email: body.buyerEmail,
    product_id: product.id,
    order_id: order.id,
  })

  if (purchaseResult.error) {
    return NextResponse.json({ error: purchaseResult.error.message }, { status: 500 })
  }

  if (product.product_type === 'subscription') {
    const now = new Date()
    const next = new Date(now)
    next.setDate(now.getDate() + 30)

    const subResult = await admin.from('subscriptions').insert({
      user_id: user?.id ?? null,
      customer_email: body.buyerEmail,
      product_id: product.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: next.toISOString(),
      amount_cents: body.totalCents,
      currency: demoProduct.currency,
    })

    if (subResult.error) {
      return NextResponse.json({ error: subResult.error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ mode: 'live', orderId: order.id })
}
