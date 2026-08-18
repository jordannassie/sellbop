import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { paginate, type AdminPaginationParams } from '@/lib/admin/helpers'

export interface AdminProductSummary {
  id: string
  title: string
  slug: string
  storeId: string
  storeName: string | null
  storeSlug: string | null
  sellerUserId: string | null
  coverImageUrl: string | null
  priceCents: number
  saleEnabled: boolean
  salePriceCents: number | null
  category: string | null
  isLive: boolean
  marketplaceListing: boolean
  affiliateEnabled: boolean
  affiliateCommissionPercent: number | null
  orderCount: number
  revenueCents: number
  platformRevenueCents: number
  createdAt: string
  updatedAt: string
}

export interface AdminProductDetail extends AdminProductSummary {
  shortDescription: string | null
  description: string | null
  productType: string
  fileCount: number
  mediaCount: number
  sellerEmail: string | null
  sellerName: string | null
  refundCount: number
}

function matchesProductFilter(product: AdminProductSummary, filter?: string): boolean {
  if (!filter || filter === 'all') return true
  switch (filter) {
    case 'active': return product.isLive
    case 'draft': return !product.isLive
    case 'marketplace': return product.marketplaceListing
    case 'direct': return !product.marketplaceListing
    case 'affiliate': return product.affiliateEnabled
    case 'free': return product.priceCents === 0
    case 'paid': return product.priceCents > 0
    default:
      return product.category?.toLowerCase() === filter.toLowerCase()
  }
}

function matchesProductSearch(product: AdminProductSummary, q?: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    product.title.toLowerCase().includes(needle)
    || product.id.toLowerCase().includes(needle)
    || (product.storeName?.toLowerCase().includes(needle) ?? false)
    || (product.storeSlug?.toLowerCase().includes(needle) ?? false)
  )
}

export async function getAdminProducts(options?: AdminPaginationParams & { marketplaceOnly?: boolean }) {
  const admin = getSupabaseAdminClient()
  const [productsResult, storesResult, ordersResult] = await Promise.all([
    admin.from('products').select('*').order('created_at', { ascending: false }),
    admin.from('stores').select('id, slug, name, owner_user_id'),
    admin.from('orders').select('product_id, total_cents, platform_fee_cents, payment_status, refund_status'),
  ])

  if (productsResult.error) throw productsResult.error
  if (storesResult.error) throw storesResult.error
  if (ordersResult.error) throw ordersResult.error

  const storeById = new Map((storesResult.data ?? []).map((s) => [s.id, s]))
  const orderStats = new Map<string, { count: number; revenue: number; platform: number; refunds: number }>()

  for (const order of ordersResult.data ?? []) {
    if (!order.product_id) continue
    const stats = orderStats.get(order.product_id) ?? { count: 0, revenue: 0, platform: 0, refunds: 0 }
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      stats.count += 1
      stats.revenue += order.total_cents ?? 0
      stats.platform += order.platform_fee_cents ?? 0
    }
    if (order.refund_status === 'refunded' || order.refund_status === 'partially_refunded') {
      stats.refunds += 1
    }
    orderStats.set(order.product_id, stats)
  }

  let products: AdminProductSummary[] = (productsResult.data ?? []).map((p) => {
    const store = storeById.get(p.store_id)
    const stats = orderStats.get(p.id)
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      storeId: p.store_id,
      storeName: store?.name ?? null,
      storeSlug: store?.slug ?? null,
      sellerUserId: store?.owner_user_id ?? null,
      coverImageUrl: p.cover_image_url ?? p.image_url ?? null,
      priceCents: p.price_cents ?? 0,
      saleEnabled: p.sale_enabled ?? false,
      salePriceCents: p.sale_price_cents,
      category: p.category,
      isLive: p.is_live ?? false,
      marketplaceListing: p.marketplace_listing ?? false,
      affiliateEnabled: p.affiliate_enabled ?? false,
      affiliateCommissionPercent: p.affiliate_commission_percent,
      orderCount: stats?.count ?? 0,
      revenueCents: stats?.revenue ?? 0,
      platformRevenueCents: stats?.platform ?? 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })

  if (options?.marketplaceOnly) {
    products = products.filter((p) => p.marketplaceListing)
  }

  products = products.filter((p) => matchesProductFilter(p, options?.filter))
  products = products.filter((p) => matchesProductSearch(p, options?.q))

  if (!options) return { products, ...paginate(products, 1, products.length || 1) }

  const paged = paginate(products, options.page, options.pageSize)
  return { products: paged.items, ...paged }
}

export async function getAdminProductById(productId: string): Promise<AdminProductDetail | null> {
  const admin = getSupabaseAdminClient()
  const { data: product, error } = await admin.from('products').select('*').eq('id', productId).maybeSingle()
  if (error || !product) return null

  const [storeResult, filesResult, mediaResult, ordersResult, sellerProfile] = await Promise.all([
    admin.from('stores').select('id, slug, name, owner_user_id, stripe_charges_enabled, stripe_onboarding_complete').eq('id', product.store_id).maybeSingle(),
    admin.from('product_files').select('id').eq('product_id', productId),
    admin.from('product_media').select('id').eq('product_id', productId),
    admin.from('orders').select('total_cents, platform_fee_cents, payment_status, refund_status, affiliate_commission_id').eq('product_id', productId),
    admin.from('stores').select('owner_user_id').eq('id', product.store_id).maybeSingle().then(async (r) => {
      if (!r.data?.owner_user_id) return null
      const { data } = await admin.from('profiles').select('email, full_name').eq('user_id', r.data.owner_user_id).maybeSingle()
      return data
    }),
  ])

  const store = storeResult.data
  let orderCount = 0
  let revenueCents = 0
  let platformRevenueCents = 0
  let refundCount = 0
  for (const order of ordersResult.data ?? []) {
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      orderCount += 1
      revenueCents += order.total_cents ?? 0
      platformRevenueCents += order.platform_fee_cents ?? 0
    }
    if (order.refund_status === 'refunded' || order.refund_status === 'partially_refunded') {
      refundCount += 1
    }
  }

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    storeId: product.store_id,
    storeName: store?.name ?? null,
    storeSlug: store?.slug ?? null,
    sellerUserId: store?.owner_user_id ?? null,
    coverImageUrl: product.cover_image_url ?? product.image_url ?? null,
    priceCents: product.price_cents ?? 0,
    saleEnabled: product.sale_enabled ?? false,
    salePriceCents: product.sale_price_cents,
    category: product.category,
    isLive: product.is_live ?? false,
    marketplaceListing: product.marketplace_listing ?? false,
    affiliateEnabled: product.affiliate_enabled ?? false,
    affiliateCommissionPercent: product.affiliate_commission_percent,
    orderCount,
    revenueCents,
    platformRevenueCents,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    shortDescription: product.short_description,
    description: product.description,
    productType: product.product_type,
    fileCount: filesResult.data?.length ?? 0,
    mediaCount: mediaResult.data?.length ?? 0,
    sellerEmail: sellerProfile?.email ?? null,
    sellerName: sellerProfile?.full_name ?? null,
    refundCount,
  }
}
