import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type PurchaseRow = Pick<
  Database['public']['Tables']['purchases']['Row'],
  'id' | 'product_id' | 'order_id' | 'created_at'
>

type OrderRow = Pick<
  Database['public']['Tables']['orders']['Row'],
  'id' | 'total_cents' | 'status' | 'payment_status' | 'created_at'
>

type OrderItemRow = Pick<
  Database['public']['Tables']['order_items']['Row'],
  'order_id' | 'product_id' | 'title'
>

type ProductRow = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'title' | 'slug' | 'price_cents' | 'product_type'
>

type ProductFileRow = Pick<
  Database['public']['Tables']['product_files']['Row'],
  'id' | 'product_id' | 'file_name' | 'file_url' | 'file_type' | 'visibility'
>

type ProductUpdateRow = Pick<
  Database['public']['Tables']['product_updates']['Row'],
  'id' | 'product_id' | 'title' | 'body' | 'link_url' | 'link_label' | 'created_at'
>

type SubscriptionRow = Pick<
  Database['public']['Tables']['subscriptions']['Row'],
  'id' | 'product_id' | 'customer_email' | 'status' | 'current_period_end' | 'amount_cents' | 'currency' | 'created_at'
>

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ orders: [], subscriptions: [] }, { status: 401 })
  }

  // Use the admin client so email-based lookups aren't blocked by RLS
  // (RLS on purchases only checks buyer_user_id, not buyer_email).
  const admin = getSupabaseAdminClient()
  const userEmail = user.email.trim().toLowerCase()

  // ── Purchases ──────────────────────────────────────────────────────────
  // Fetch by user ID OR email to capture guest purchases whose
  // buyer_user_id hasn't been back-filled yet.
  const [purchasesByUserId, purchasesByEmail] = await Promise.all([
    admin
      .from('purchases')
      .select('id,product_id,order_id,created_at')
      .eq('buyer_user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('purchases')
      .select('id,product_id,order_id,created_at')
      .ilike('buyer_email', userEmail)
      .order('created_at', { ascending: false }),
  ])

  if (purchasesByUserId.error) {
    return NextResponse.json({ error: purchasesByUserId.error.message }, { status: 500 })
  }
  if (purchasesByEmail.error) {
    return NextResponse.json({ error: purchasesByEmail.error.message }, { status: 500 })
  }

  // Deduplicate by purchase ID
  const purchaseMap = new Map<string, PurchaseRow>()
  for (const p of [...(purchasesByUserId.data ?? []), ...(purchasesByEmail.data ?? [])] as PurchaseRow[]) {
    if (!purchaseMap.has(p.id)) purchaseMap.set(p.id, p)
  }
  const purchases = [...purchaseMap.values()]

  // ── Orders (as buyer) ──────────────────────────────────────────────────
  const [ordersByUserId, ordersByEmail] = await Promise.all([
    admin
      .from('orders')
      .select('id,total_cents,status,payment_status,created_at')
      .eq('buyer_user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('orders')
      .select('id,total_cents,status,payment_status,created_at')
      .ilike('buyer_email', userEmail)
      .order('created_at', { ascending: false }),
  ])

  if (ordersByUserId.error) {
    return NextResponse.json({ error: ordersByUserId.error.message }, { status: 500 })
  }
  if (ordersByEmail.error) {
    return NextResponse.json({ error: ordersByEmail.error.message }, { status: 500 })
  }

  // Deduplicate by order ID
  const orderMap = new Map<string, OrderRow>()
  for (const o of [...(ordersByUserId.data ?? []), ...(ordersByEmail.data ?? [])] as OrderRow[]) {
    if (!orderMap.has(o.id)) orderMap.set(o.id, o)
  }
  const buyerOrders = [...orderMap.values()]

  // ── Order items ────────────────────────────────────────────────────────
  const orderIds = [...new Set(buyerOrders.map((order) => order.id))]
  const { data: orderItems, error: orderItemsError } = orderIds.length
    ? await admin
        .from('order_items')
        .select('order_id,product_id,title')
        .in('order_id', orderIds)
    : { data: [], error: null }

  if (orderItemsError) {
    return NextResponse.json({ error: orderItemsError.message }, { status: 500 })
  }

  // ── Subscriptions ──────────────────────────────────────────────────────
  const [subsByUserId, subsByEmail] = await Promise.all([
    admin
      .from('subscriptions')
      .select('id,product_id,customer_email,status,current_period_end,amount_cents,currency,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('subscriptions')
      .select('id,product_id,customer_email,status,current_period_end,amount_cents,currency,created_at')
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false }),
  ])

  if (subsByUserId.error) {
    return NextResponse.json({ error: subsByUserId.error.message }, { status: 500 })
  }
  if (subsByEmail.error) {
    return NextResponse.json({ error: subsByEmail.error.message }, { status: 500 })
  }

  const subsMap = new Map<string, SubscriptionRow>()
  for (const s of [...(subsByUserId.data ?? []), ...(subsByEmail.data ?? [])] as SubscriptionRow[]) {
    if (!subsMap.has(s.id)) subsMap.set(s.id, s)
  }
  const subscriptions = [...subsMap.values()]

  // ── Build product look-up ──────────────────────────────────────────────
  const productIds = [
    ...new Set([
      ...purchases.map((purchase) => purchase.product_id),
      ...subscriptions.map((subscription) => subscription.product_id),
      ...((orderItems ?? []) as OrderItemRow[]).map((item) => item.product_id),
    ]),
  ]

  const { data: products, error: productsError } = productIds.length
    ? await admin
        .from('products')
        .select('id,title,slug,price_cents,product_type')
        .in('id', productIds)
    : { data: [], error: null }

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 })
  }

  const orderById = new Map<string, OrderRow>(
    buyerOrders.map((order) => [order.id, order]),
  )
  const productById = new Map<string, ProductRow>(
    ((products ?? []) as ProductRow[]).map((product) => [product.id, product]),
  )
  const orderTitleByOrderId = new Map<string, string>()
  const productIdByOrderId = new Map<string, string>()

  for (const item of (orderItems ?? []) as OrderItemRow[]) {
    if (!orderTitleByOrderId.has(item.order_id)) {
      orderTitleByOrderId.set(item.order_id, item.title)
    }
    if (!productIdByOrderId.has(item.order_id)) {
      productIdByOrderId.set(item.order_id, item.product_id)
    }
  }

  // ── V5: Fetch product_files and product_updates for purchased products ──
  const purchasedProductIds = [...new Set(purchases.map(p => p.product_id))]

  const [{ data: rawFiles }, { data: rawUpdates }] = await Promise.all([
    purchasedProductIds.length
      ? admin
          .from('product_files')
          .select('id,product_id,file_name,file_url,file_type,visibility')
          .in('product_id', purchasedProductIds)
          .in('visibility', ['public', 'buyers'])
          .order('sort_order', { ascending: true })
      : { data: [] },
    purchasedProductIds.length
      ? admin
          .from('product_updates')
          .select('id,product_id,title,body,link_url,link_label,created_at')
          .in('product_id', purchasedProductIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : { data: [] },
  ])

  // Group files + updates by product_id
  const filesByProductId: Record<string, ProductFileRow[]> = {}
  const updatesByProductId: Record<string, ProductUpdateRow[]> = {}

  for (const f of (rawFiles ?? []) as ProductFileRow[]) {
    ;(filesByProductId[f.product_id] ??= []).push(f)
  }
  for (const u of (rawUpdates ?? []) as ProductUpdateRow[]) {
    ;(updatesByProductId[u.product_id] ??= []).push(u)
  }

  const libraryOrders = new Map<
    string,
    {
      id: string
      productId: string | null
      productSlug: string | null
      productType: string | null
      productName: string
      productFiles: ProductFileRow[]
      productUpdates: ProductUpdateRow[]
      amount: number
      status: string
      paymentStatus: string
      createdAt: string
    }
  >()

  for (const purchase of purchases) {
    const order = orderById.get(purchase.order_id)
    const product = productById.get(purchase.product_id)

    libraryOrders.set(purchase.order_id, {
      id: purchase.order_id,
      productId: purchase.product_id,
      productSlug: product?.slug ?? null,
      productType: product?.product_type ?? null,
      productName: orderTitleByOrderId.get(purchase.order_id) ?? product?.title ?? 'Purchase',
      productFiles: filesByProductId[purchase.product_id] ?? [],
      productUpdates: updatesByProductId[purchase.product_id] ?? [],
      amount: order?.total_cents ?? product?.price_cents ?? 0,
      status: order?.status ?? 'paid',
      paymentStatus: order?.payment_status ?? 'paid',
      createdAt: order?.created_at ?? purchase.created_at,
    })
  }

  for (const order of buyerOrders) {
    if (libraryOrders.has(order.id)) continue

    const productId = productIdByOrderId.get(order.id) ?? ''
    const product = productById.get(productId)

    libraryOrders.set(order.id, {
      id: order.id,
      productId: productId || null,
      productSlug: product?.slug ?? null,
      productType: product?.product_type ?? null,
      productName: orderTitleByOrderId.get(order.id) ?? product?.title ?? 'Order',
      productFiles: filesByProductId[productId] ?? [],
      productUpdates: updatesByProductId[productId] ?? [],
      amount: order.total_cents,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
    })
  }

  return NextResponse.json({
    orders: [...libraryOrders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    subscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      customerEmail: subscription.customer_email,
      productName: productById.get(subscription.product_id)?.title ?? 'Subscription',
      productSlug: productById.get(subscription.product_id)?.slug ?? null,
      productType: productById.get(subscription.product_id)?.product_type ?? null,
      amount: subscription.amount_cents ?? 0,
      currency: subscription.currency ?? 'usd',
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      createdAt: subscription.created_at,
    })),
  })
}
