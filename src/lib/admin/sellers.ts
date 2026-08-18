import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { paginate, type AdminPaginationParams } from '@/lib/admin/helpers'

export interface AdminSellerSummary {
  userId: string
  email: string
  fullName: string | null
  storeId: string
  storeName: string
  storeSlug: string
  stripeConnected: boolean
  stripeOnboardingComplete: boolean
  productCount: number
  orderCount: number
  grossSalesCents: number
  platformFeesCents: number
  sellerNetCents: number
  affiliateSalesCount: number
  refundCount: number
  joinedAt: string
}

export async function getAdminSellers(options?: AdminPaginationParams) {
  const admin = getSupabaseAdminClient()
  const [storesResult, profilesResult, productsResult, ordersResult, commissionsResult] = await Promise.all([
    admin.from('stores').select('*').order('created_at', { ascending: false }),
    admin.from('profiles').select('user_id, email, full_name, created_at'),
    admin.from('products').select('id, store_id'),
    admin.from('orders').select('id, store_id, seller_user_id, total_cents, platform_fee_cents, payment_status, refund_status, affiliate_commission_id'),
    admin.from('affiliate_commissions').select('seller_id, order_id, status'),
  ])

  if (storesResult.error) throw storesResult.error
  if (profilesResult.error) throw profilesResult.error
  if (productsResult.error) throw productsResult.error
  if (ordersResult.error) throw ordersResult.error
  if (commissionsResult.error) throw commissionsResult.error

  const profileById = new Map((profilesResult.data ?? []).map((p) => [p.user_id, p]))
  const productCountByStore = new Map<string, number>()
  for (const product of productsResult.data ?? []) {
    productCountByStore.set(product.store_id, (productCountByStore.get(product.store_id) ?? 0) + 1)
  }

  const affiliateOrderIds = new Set(
    (commissionsResult.data ?? [])
      .filter((c) => c.status !== 'reversed')
      .map((c) => c.order_id),
  )

  let sellers: AdminSellerSummary[] = (storesResult.data ?? []).map((store) => {
    const profile = profileById.get(store.owner_user_id)
    const storeOrders = (ordersResult.data ?? []).filter((o) => o.store_id === store.id)
    let grossSalesCents = 0
    let platformFeesCents = 0
    let affiliateSalesCount = 0
    let refundCount = 0

    for (const order of storeOrders) {
      if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
        grossSalesCents += order.total_cents ?? 0
        platformFeesCents += order.platform_fee_cents ?? 0
      }
      if (order.affiliate_commission_id || affiliateOrderIds.has(order.id)) {
        affiliateSalesCount += 1
      }
      if (order.refund_status === 'refunded' || order.refund_status === 'partially_refunded') {
        refundCount += 1
      }
    }

    return {
      userId: store.owner_user_id,
      email: profile?.email ?? 'Unknown',
      fullName: profile?.full_name ?? null,
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      stripeConnected: Boolean(store.stripe_account_id),
      stripeOnboardingComplete: Boolean(store.stripe_onboarding_complete),
      productCount: productCountByStore.get(store.id) ?? 0,
      orderCount: storeOrders.length,
      grossSalesCents,
      platformFeesCents,
      sellerNetCents: Math.max(0, grossSalesCents - platformFeesCents),
      affiliateSalesCount,
      refundCount,
      joinedAt: store.created_at ?? profile?.created_at ?? '',
    }
  })

  if (options?.q) {
    const needle = options.q.toLowerCase()
    sellers = sellers.filter((s) =>
      s.email.toLowerCase().includes(needle)
      || s.storeName.toLowerCase().includes(needle)
      || s.storeSlug.toLowerCase().includes(needle)
      || (s.fullName?.toLowerCase().includes(needle) ?? false),
    )
  }

  if (options?.filter === 'stripe') sellers = sellers.filter((s) => s.stripeConnected)
  if (options?.filter === 'no-stripe') sellers = sellers.filter((s) => !s.stripeConnected)

  if (!options) return { sellers, ...paginate(sellers, 1, sellers.length || 1) }
  const paged = paginate(sellers, options.page, options.pageSize)
  return { sellers: paged.items, ...paged }
}
