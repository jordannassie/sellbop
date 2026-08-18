import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ items: [] }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  const userEmail = user.email.trim().toLowerCase()

  // Fetch purchases by user ID or email (captures guest purchases)
  const [byUserId, byEmail] = await Promise.all([
    admin
      .from('purchases')
      .select('id, product_id, order_id, created_at, status, access_token')
      .eq('buyer_user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('purchases')
      .select('id, product_id, order_id, created_at, status, access_token')
      .ilike('buyer_email', userEmail)
      .order('created_at', { ascending: false }),
  ])

  // Deduplicate
  const purchaseMap = new Map<string, {
    id: string
    product_id: string
    order_id: string
    created_at: string
    status: string | null
    access_token: string | null
  }>()
  for (const p of [...(byUserId.data ?? []), ...(byEmail.data ?? [])]) {
    if (!purchaseMap.has(p.id)) purchaseMap.set(p.id, p)
  }
  const purchases = [...purchaseMap.values()]

  if (purchases.length === 0) {
    return NextResponse.json({ items: [] })
  }

  // Load product data
  const productIds = [...new Set(purchases.map(p => p.product_id))]
  const { data: products } = await admin
    .from('products')
    .select('id, title, slug, cover_image_url, image_url, price_cents, affiliate_enabled, affiliate_commission_percent')
    .in('id', productIds)

  // Load store data for creator names
  const { data: allStores } = products?.length
    ? await admin
        .from('stores')
        .select('id, name, slug')
    : { data: [] }

  // Load product-store relationship
  const { data: productsWithStore } = products?.length
    ? await admin
        .from('products')
        .select('id, store_id')
        .in('id', productIds)
    : { data: [] }

  const storeById = new Map((allStores ?? []).map(s => [s.id, s]))
  const storeIdByProductId = new Map((productsWithStore ?? []).map(p => [p.id, p.store_id]))
  const productById = new Map((products ?? []).map(p => [p.id, p]))

  const items = purchases
    .filter(p => p.status !== 'revoked')
    .map(p => {
      const product = productById.get(p.product_id)
      const storeId = storeIdByProductId.get(p.product_id)
      const store = storeId ? storeById.get(storeId) : null
      return {
        purchaseId: p.id,
        productId: p.product_id,
        orderId: p.order_id,
        productTitle: product?.title ?? 'Product',
        productSlug: product?.slug ?? null,
        coverImage: product?.cover_image_url ?? product?.image_url ?? null,
        priceCents: product?.price_cents ?? 0,
        creatorName: store?.name ?? null,
        creatorSlug: store?.slug ?? null,
        purchasedAt: p.created_at,
        accessUrl: p.access_token ? getPurchaseAccessUrl(p.access_token) : null,
        affiliateEnabled: (product as Record<string, unknown>)?.affiliate_enabled ?? false,
        affiliateCommissionPercent: (product as Record<string, unknown>)?.affiliate_commission_percent ?? null,
      }
    })

  return NextResponse.json({ items })
}
