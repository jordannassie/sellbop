import { NextResponse } from 'next/server'
import { DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

interface MerchCheckoutPayload {
  productId: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  shippingAddress: {
    address1: string
    address2?: string
    city: string
    region: string
    zip: string
    country: string
  }
}

type LiveProduct = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'store_id' | 'title'
>

type LiveStore = Pick<
  Database['public']['Tables']['stores']['Row'],
  'id' | 'owner_user_id'
>

export async function POST(request: Request) {
  const body = (await request.json()) as MerchCheckoutPayload
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
    .select('id,store_id,title')
    .eq('slug', demoProduct.slug)
    .maybeSingle()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  const product = productRow as LiveProduct | null

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
      buyer_phone: body.buyerPhone ?? null,
      shipping_name: body.buyerName,
      shipping_address_1: body.shippingAddress.address1,
      shipping_address_2: body.shippingAddress.address2 ?? null,
      shipping_city: body.shippingAddress.city,
      shipping_state: body.shippingAddress.region,
      shipping_postal_code: body.shippingAddress.zip,
      shipping_country: body.shippingAddress.country,
      subtotal_cents: body.subtotalCents,
      shipping_cents: body.shippingCents,
      total_cents: body.totalCents,
      payment_status: 'paid',
      status: 'paid',
      fulfillment_provider: 'printify',
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

  return NextResponse.json({ mode: 'live', orderId: order.id })
}
