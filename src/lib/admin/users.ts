import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

function isMissingRelationError(error: { code?: string | null } | null) {
  return error?.code === 'PGRST205'
}

export interface AdminUserSummary {
  userId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
  isBuyer: boolean
  isSeller: boolean
  storeId: string | null
  storeSlug: string | null
  storeName: string | null
  purchaseCount: number
  orderCount: number
  subscriptionCount: number
  totalSpentCents: number
  lastPurchaseAt: string | null
}

export interface AdminOverviewData {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalOrders: number
  activeSubscriptions: number
  grossRevenueCents: number
}

export interface AdminOrderSummary {
  id: string
  buyerUserId: string | null
  sellerUserId: string | null
  buyerEmail: string | null
  buyerName: string | null
  totalCents: number
  status: string
  paymentStatus: string
  createdAt: string
  storeId: string
  storeSlug: string | null
  productName: string
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

export async function getAdminUsers() {
  const admin = getSupabaseAdminClient()

  const [profilesResult, storesResult, purchasesResult, ordersResult, subscriptionsResult] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('stores').select('id,owner_user_id,slug,name'),
    admin.from('purchases').select('buyer_user_id,created_at'),
    admin.from('orders').select('id,buyer_user_id,total_cents,created_at,payment_status'),
    admin.from('subscriptions').select('user_id,status'),
  ])

  for (const result of [profilesResult, storesResult, purchasesResult, ordersResult, subscriptionsResult]) {
    if (result.error) throw result.error
  }

  const storesByOwner = new Map((storesResult.data ?? []).map((store) => [store.owner_user_id, store]))

  const aggregateByUserId = new Map<string, Omit<AdminUserSummary, 'email' | 'fullName' | 'avatarUrl' | 'createdAt'>>()

  for (const profile of profilesResult.data ?? []) {
    const store = storesByOwner.get(profile.user_id)
    aggregateByUserId.set(profile.user_id, {
      userId: profile.user_id,
      isBuyer: false,
      isSeller: Boolean(store),
      storeId: store?.id ?? null,
      storeSlug: store?.slug ?? null,
      storeName: store?.name ?? null,
      purchaseCount: 0,
      orderCount: 0,
      subscriptionCount: 0,
      totalSpentCents: 0,
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
    if (!order.buyer_user_id) continue
    const target = aggregateByUserId.get(order.buyer_user_id)
    if (!target) continue
    target.isBuyer = true
    target.orderCount += 1
    if (order.payment_status === 'paid') {
      target.totalSpentCents += order.total_cents
    }
    if (!target.lastPurchaseAt || new Date(order.created_at) > new Date(target.lastPurchaseAt)) {
      target.lastPurchaseAt = order.created_at
    }
  }

  for (const subscription of subscriptionsResult.data ?? []) {
    if (!subscription.user_id) continue
    const target = aggregateByUserId.get(subscription.user_id)
    if (!target) continue
    target.isBuyer = true
    target.subscriptionCount += 1
  }

  return (profilesResult.data ?? []).map((profile) => {
    const aggregate = aggregateByUserId.get(profile.user_id)!
    return {
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      ...aggregate,
    } satisfies AdminUserSummary
  })
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const admin = getSupabaseAdminClient()
  const [users, ordersResult, subscriptionsResult] = await Promise.all([
    getAdminUsers(),
    admin.from('orders').select('total_cents,payment_status'),
    admin.from('subscriptions').select('status'),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (subscriptionsResult.error) throw subscriptionsResult.error

  return {
    totalUsers: users.length,
    totalSellers: users.filter((user) => user.isSeller).length,
    totalBuyers: users.filter((user) => user.isBuyer).length,
    totalOrders: ordersResult.data?.length ?? 0,
    activeSubscriptions: (subscriptionsResult.data ?? []).filter((sub) => sub.status === 'active').length,
    grossRevenueCents: (ordersResult.data ?? [])
      .filter((order) => order.payment_status === 'paid')
      .reduce((sum, order) => sum + order.total_cents, 0),
  }
}

export async function getAdminOrders() {
  const admin = getSupabaseAdminClient()
  const [ordersResult, orderItemsResult, storesResult] = await Promise.all([
    admin
      .from('orders')
      .select('id,buyer_user_id,seller_user_id,buyer_email,buyer_name,total_cents,status,payment_status,created_at,store_id')
      .order('created_at', { ascending: false }),
    admin.from('order_items').select('order_id,title'),
    admin.from('stores').select('id,slug'),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (orderItemsResult.error && !isMissingRelationError(orderItemsResult.error)) {
    throw orderItemsResult.error
  }
  if (storesResult.error) throw storesResult.error

  const titleByOrderId = new Map<string, string>()
  for (const item of orderItemsResult.data ?? []) {
    if (!titleByOrderId.has(item.order_id)) {
      titleByOrderId.set(item.order_id, item.title)
    }
  }

  const storeById = new Map((storesResult.data ?? []).map((store) => [store.id, store]))

  return (ordersResult.data ?? []).map((order) => ({
    id: order.id,
    buyerUserId: order.buyer_user_id,
    sellerUserId: order.seller_user_id,
    buyerEmail: order.buyer_email,
    buyerName: order.buyer_name,
    totalCents: order.total_cents,
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    storeId: order.store_id,
    storeSlug: storeById.get(order.store_id)?.slug ?? null,
    productName: titleByOrderId.get(order.id) ?? 'Order',
  } satisfies AdminOrderSummary))
}

export async function getAdminOrderById(orderId: string) {
  const orders = await getAdminOrders()
  return orders.find((order) => order.id === orderId) ?? null
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
  const users = await getAdminUsers()
  return users.find((user) => user.userId === userId) ?? null
}
