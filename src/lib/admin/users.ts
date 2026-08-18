import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { inferSaleSource, isMissingRelationError, paginate, type AdminPaginationParams } from '@/lib/admin/helpers'
import { getAdminBuyers } from '@/lib/admin/buyers'
import { getAdminProducts } from '@/lib/admin/products'
import { getAdminOrders } from '@/lib/admin/orders'
import { getAdminSellers } from '@/lib/admin/sellers'

export interface AdminUserSummary {
  userId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
  emailVerified: boolean | null
  isBuyer: boolean
  isSeller: boolean
  storeId: string | null
  storeSlug: string | null
  storeName: string | null
  productCount: number
  purchaseCount: number
  orderCount: number
  subscriptionCount: number
  totalSpentCents: number
  totalSalesCents: number
  lastPurchaseAt: string | null
}

export interface AdminOverviewData {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalGuestBuyers: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  totalPurchases: number
  activeSubscriptions: number
  grossSalesCents: number
  platformRevenueCents: number
  sellerRevenueCents: number
  affiliateCommissionsCents: number
  refundedCents: number
  refundCount: number
  marketplaceSalesCount: number
  marketplaceGrossCents: number
  directSalesCount: number
  freeAcquisitionsCount: number
  emailsSent: number
  emailsFailed: number
  recentOrders: Awaited<ReturnType<typeof getAdminOrders>>['orders']
  recentProducts: Awaited<ReturnType<typeof getAdminProducts>>['products']
  recentSellers: Awaited<ReturnType<typeof getAdminSellers>>['sellers']
}

export interface AdminSubscriptionSummary {
  id: string
  userId: string | null
  customerEmail: string
  productId: string
  productName: string
  status: string
  amountCents: number | null
  currency: string | null
  currentPeriodEnd: string | null
  createdAt: string
}

export async function getAdminUsers(options?: AdminPaginationParams) {
  const admin = getSupabaseAdminClient()
  const [profilesResult, storesResult, purchasesResult, ordersResult, subscriptionsResult, productsResult, sellerOrdersResult] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('stores').select('id,owner_user_id,slug,name'),
    admin.from('purchases').select('buyer_user_id,created_at'),
    admin.from('orders').select('id,buyer_user_id,seller_user_id,total_cents,created_at,payment_status'),
    admin.from('subscriptions').select('user_id,status'),
    admin.from('products').select('store_id'),
    admin.from('orders').select('seller_user_id, total_cents, payment_status'),
  ])

  for (const result of [profilesResult, storesResult, purchasesResult, ordersResult, subscriptionsResult, productsResult, sellerOrdersResult]) {
    if (result.error) throw result.error
  }

  const storesByOwner = new Map((storesResult.data ?? []).map((store) => [store.owner_user_id, store]))
  const productCountByStore = new Map<string, number>()
  for (const product of productsResult.data ?? []) {
    productCountByStore.set(product.store_id, (productCountByStore.get(product.store_id) ?? 0) + 1)
  }

  const aggregateByUserId = new Map<string, Omit<AdminUserSummary, 'email' | 'fullName' | 'avatarUrl' | 'createdAt' | 'emailVerified'>>()

  for (const profile of profilesResult.data ?? []) {
    const store = storesByOwner.get(profile.user_id)
    aggregateByUserId.set(profile.user_id, {
      userId: profile.user_id,
      isBuyer: false,
      isSeller: Boolean(store),
      storeId: store?.id ?? null,
      storeSlug: store?.slug ?? null,
      storeName: store?.name ?? null,
      productCount: store ? (productCountByStore.get(store.id) ?? 0) : 0,
      purchaseCount: 0,
      orderCount: 0,
      subscriptionCount: 0,
      totalSpentCents: 0,
      totalSalesCents: 0,
      lastPurchaseAt: null,
    })
  }

  for (const purchase of purchasesResult.data ?? []) {
    if (!purchase.buyer_user_id) continue
    const target = aggregateByUserId.get(purchase.buyer_user_id)
    if (!target) continue
    target.isBuyer = true
    target.purchaseCount += 1
  }

  for (const order of ordersResult.data ?? []) {
    if (order.buyer_user_id) {
      const target = aggregateByUserId.get(order.buyer_user_id)
      if (target) {
        target.isBuyer = true
        target.orderCount += 1
        if (order.payment_status === 'paid') {
          target.totalSpentCents += order.total_cents
        }
        if (!target.lastPurchaseAt || new Date(order.created_at) > new Date(target.lastPurchaseAt)) {
          target.lastPurchaseAt = order.created_at
        }
      }
    }
  }

  for (const order of sellerOrdersResult.data ?? []) {
    if (!order.seller_user_id) continue
    const target = aggregateByUserId.get(order.seller_user_id)
    if (!target) continue
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      target.totalSalesCents += order.total_cents ?? 0
    }
  }

  for (const subscription of subscriptionsResult.data ?? []) {
    if (!subscription.user_id) continue
    const target = aggregateByUserId.get(subscription.user_id)
    if (!target) continue
    target.isBuyer = true
    target.subscriptionCount += 1
  }

  let users: AdminUserSummary[] = (profilesResult.data ?? []).map((profile) => {
    const aggregate = aggregateByUserId.get(profile.user_id)!
    return {
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      emailVerified: null,
      ...aggregate,
    }
  })

  if (options?.q) {
    const needle = options.q.toLowerCase()
    users = users.filter((u) =>
      u.email.toLowerCase().includes(needle)
      || (u.fullName?.toLowerCase().includes(needle) ?? false)
      || u.userId.toLowerCase().includes(needle),
    )
  }

  if (options?.filter === 'sellers') users = users.filter((u) => u.isSeller)
  if (options?.filter === 'buyers') users = users.filter((u) => u.isBuyer)
  if (options?.filter === 'verified') users = users.filter((u) => u.emailVerified === true)
  if (options?.filter === 'unverified') users = users.filter((u) => u.emailVerified === false)

  if (!options) return { users, ...paginate(users, 1, users.length || 1) }
  const paged = paginate(users, options.page, options.pageSize)
  return { users: paged.items, ...paged }
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const admin = getSupabaseAdminClient()
  const [
    usersResult,
    productsResult,
    ordersResult,
    purchasesResult,
    subscriptionsResult,
    commissionsResult,
    emailsResult,
    buyersResult,
    recentOrdersResult,
    recentProductsResult,
    recentSellersResult,
  ] = await Promise.all([
    getAdminUsers(),
    admin.from('products').select('is_live'),
    admin.from('orders').select('total_cents, platform_fee_cents, payment_status, refund_status, refunded_cents'),
    admin.from('purchases').select('id'),
    admin.from('subscriptions').select('status'),
    admin.from('affiliate_commissions').select('commission_cents, status'),
    admin.from('transactional_email_deliveries').select('status'),
    getAdminBuyers(),
    getAdminOrders({ page: 1, pageSize: 5 }),
    getAdminProducts({ page: 1, pageSize: 5 }),
    getAdminSellers({ page: 1, pageSize: 5 }),
  ])

  if (productsResult.error) throw productsResult.error
  if (ordersResult.error) throw ordersResult.error
  if (purchasesResult.error) throw purchasesResult.error
  if (subscriptionsResult.error) throw subscriptionsResult.error
  if (commissionsResult.error) throw commissionsResult.error

  const paidOrders = (ordersResult.data ?? []).filter((o) => o.payment_status === 'paid' || o.payment_status === 'refunded')
  const grossSalesCents = paidOrders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0)
  const platformRevenueCents = paidOrders.reduce((sum, o) => sum + (o.platform_fee_cents ?? 0), 0)
  const affiliateCommissionsCents = (commissionsResult.data ?? [])
    .filter((c) => c.status !== 'reversed')
    .reduce((sum, c) => sum + c.commission_cents, 0)
  const refundedCents = paidOrders.reduce((sum, o) => sum + (o.refunded_cents ?? 0), 0)
  const refundCount = (ordersResult.data ?? []).filter((o) =>
    o.refund_status === 'refunded' || o.refund_status === 'partially_refunded',
  ).length

  let marketplaceSalesCount = 0
  let marketplaceGrossCents = 0
  let directSalesCount = 0
  let freeAcquisitionsCount = 0
  for (const order of paidOrders) {
    const source = inferSaleSource({
      totalCents: order.total_cents ?? 0,
      platformFeeCents: order.platform_fee_cents ?? 0,
    })
    if (source === 'marketplace') {
      marketplaceSalesCount += 1
      marketplaceGrossCents += order.total_cents ?? 0
    } else if (source === 'direct') {
      directSalesCount += 1
    } else {
      freeAcquisitionsCount += 1
    }
  }

  let emailsSent = 0
  let emailsFailed = 0
  if (!emailsResult.error) {
    for (const row of emailsResult.data ?? []) {
      if (row.status === 'sent' || row.status === 'delivered') emailsSent += 1
      if (row.status === 'failed' || row.status === 'bounced') emailsFailed += 1
    }
  }

  return {
    totalUsers: usersResult.users.length,
    totalSellers: usersResult.users.filter((u) => u.isSeller).length,
    totalBuyers: buyersResult.buyers.length,
    totalGuestBuyers: buyersResult.buyers.filter((b) => b.isGuest).length,
    totalProducts: productsResult.data?.length ?? 0,
    activeProducts: (productsResult.data ?? []).filter((p) => p.is_live).length,
    totalOrders: ordersResult.data?.length ?? 0,
    totalPurchases: purchasesResult.data?.length ?? 0,
    activeSubscriptions: (subscriptionsResult.data ?? []).filter((s) => s.status === 'active').length,
    grossSalesCents,
    platformRevenueCents,
    sellerRevenueCents: Math.max(0, grossSalesCents - platformRevenueCents - affiliateCommissionsCents),
    affiliateCommissionsCents,
    refundedCents,
    refundCount,
    marketplaceSalesCount,
    marketplaceGrossCents,
    directSalesCount,
    freeAcquisitionsCount,
    emailsSent,
    emailsFailed,
    recentOrders: recentOrdersResult.orders,
    recentProducts: recentProductsResult.products,
    recentSellers: recentSellersResult.sellers,
  }
}

export async function getAdminSubscriptions() {
  const admin = getSupabaseAdminClient()
  const [subscriptionsResult, productsResult] = await Promise.all([
    admin
      .from('subscriptions')
      .select('id,user_id,customer_email,product_id,status,amount_cents,currency,current_period_end,created_at')
      .order('created_at', { ascending: false }),
    admin.from('products').select('id,title'),
  ])

  if (subscriptionsResult.error) throw subscriptionsResult.error
  if (productsResult.error) throw productsResult.error

  const productById = new Map((productsResult.data ?? []).map((product) => [product.id, product.title]))

  return (subscriptionsResult.data ?? []).map((subscription) => ({
    id: subscription.id,
    userId: subscription.user_id,
    customerEmail: subscription.customer_email,
    productId: subscription.product_id,
    productName: productById.get(subscription.product_id) ?? 'Subscription',
    status: subscription.status,
    amountCents: subscription.amount_cents,
    currency: subscription.currency,
    currentPeriodEnd: subscription.current_period_end,
    createdAt: subscription.created_at,
  } satisfies AdminSubscriptionSummary))
}

export async function getAdminSubscriptionById(subscriptionId: string) {
  const subscriptions = await getAdminSubscriptions()
  return subscriptions.find((subscription) => subscription.id === subscriptionId) ?? null
}

export async function getAdminUserById(userId: string) {
  const { users } = await getAdminUsers()
  return users.find((user) => user.userId === userId) ?? null
}

export async function getAdminUserDetail(userId: string) {
  const user = await getAdminUserById(userId)
  if (!user) return null

  const admin = getSupabaseAdminClient()
  const [productsResult, purchasesResult, ordersAsBuyer, ordersAsSeller, affiliateRels, commissions] = await Promise.all([
    user.storeId
      ? admin.from('products').select('id, title, slug, is_live, price_cents').eq('store_id', user.storeId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    admin.from('purchases').select('id, product_id, order_id, status, created_at').eq('buyer_user_id', userId).order('created_at', { ascending: false }),
    admin.from('orders').select('id, total_cents, payment_status, created_at, product_title_snapshot').eq('buyer_user_id', userId).order('created_at', { ascending: false }),
    admin.from('orders').select('id, total_cents, payment_status, created_at, product_title_snapshot, buyer_email').eq('seller_user_id', userId).order('created_at', { ascending: false }),
    admin.from('affiliate_relationships').select('id, product_id, referral_code, status').eq('affiliate_user_id', userId),
    admin.from('affiliate_commissions').select('id, commission_cents, status, created_at').eq('affiliate_user_id', userId),
  ])

  return {
    user,
    products: productsResult.data ?? [],
    purchases: purchasesResult.data ?? [],
    ordersAsBuyer: ordersAsBuyer.data ?? [],
    ordersAsSeller: ordersAsSeller.data ?? [],
    affiliateRelationships: affiliateRels.data ?? [],
    affiliateCommissions: commissions.data ?? [],
  }
}

export async function adminGlobalSearch(q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return { users: [], products: [], orders: [], buyers: [] }

  const [users, products, orders, buyers] = await Promise.all([
    getAdminUsers({ page: 1, pageSize: 8, q: needle }),
    getAdminProducts({ page: 1, pageSize: 8, q: needle }),
    getAdminOrders({ page: 1, pageSize: 8, q: needle }),
    getAdminBuyers({ page: 1, pageSize: 8, q: needle }),
  ])

  return {
    users: users.users.slice(0, 5),
    products: products.products.slice(0, 5),
    orders: orders.orders.slice(0, 5),
    buyers: buyers.buyers.slice(0, 5),
  }
}

// Re-export order types for backward compatibility
export type { AdminOrderSummary } from '@/lib/admin/orders'
export { getAdminOrders, getAdminOrderById } from '@/lib/admin/orders'
