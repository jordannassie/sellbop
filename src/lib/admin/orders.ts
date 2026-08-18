import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { inferSaleSource, isMissingRelationError, paginate, sellerNetCents, type AdminPaginationParams } from '@/lib/admin/helpers'

export interface AdminOrderSummary {
  id: string
  buyerUserId: string | null
  sellerUserId: string | null
  buyerEmail: string | null
  buyerName: string | null
  totalCents: number
  discountCents: number
  platformFeeCents: number
  affiliateCommissionCents: number
  sellerNetCents: number
  status: string
  paymentStatus: string
  refundStatus: string
  refundedCents: number
  saleSource: ReturnType<typeof inferSaleSource>
  hasAffiliate: boolean
  createdAt: string
  storeId: string
  storeSlug: string | null
  storeName: string | null
  productId: string | null
  productName: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotalCents: number
  purchaseId: string | null
  purchaseStatus: string | null
  affiliateRelationshipId: string | null
  emailDeliveryCount: number
}

export async function getAdminOrders(options?: AdminPaginationParams) {
  const admin = getSupabaseAdminClient()
  const [ordersResult, orderItemsResult, storesResult, commissionsResult] = await Promise.all([
    admin.from('orders').select('*').order('created_at', { ascending: false }),
    admin.from('order_items').select('order_id, title, product_id'),
    admin.from('stores').select('id, slug, name'),
    admin.from('affiliate_commissions').select('order_id, commission_cents, status'),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (orderItemsResult.error && !isMissingRelationError(orderItemsResult.error)) {
    throw orderItemsResult.error
  }
  if (storesResult.error) throw storesResult.error
  if (commissionsResult.error) throw commissionsResult.error

  const titleByOrderId = new Map<string, { title: string; productId: string | null }>()
  for (const item of orderItemsResult.data ?? []) {
    if (!titleByOrderId.has(item.order_id)) {
      titleByOrderId.set(item.order_id, { title: item.title, productId: item.product_id })
    }
  }

  const commissionByOrderId = new Map<string, number>()
  for (const c of commissionsResult.data ?? []) {
    if (c.status === 'reversed') continue
    commissionByOrderId.set(c.order_id, c.commission_cents)
  }

  const storeById = new Map((storesResult.data ?? []).map((store) => [store.id, store]))

  let orders: AdminOrderSummary[] = (ordersResult.data ?? []).map((order) => {
    const item = titleByOrderId.get(order.id)
    const store = storeById.get(order.store_id)
    const affiliateCommissionCents = commissionByOrderId.get(order.id) ?? 0
    const totalCents = order.total_cents ?? 0
    const platformFeeCents = order.platform_fee_cents ?? 0
    return {
      id: order.id,
      buyerUserId: order.buyer_user_id,
      sellerUserId: order.seller_user_id,
      buyerEmail: order.buyer_email,
      buyerName: order.buyer_name,
      totalCents,
      discountCents: order.discount_cents ?? 0,
      platformFeeCents,
      affiliateCommissionCents,
      sellerNetCents: sellerNetCents({ totalCents, platformFeeCents, affiliateCommissionCents }),
      status: order.status,
      paymentStatus: order.payment_status,
      refundStatus: order.refund_status ?? 'none',
      refundedCents: order.refunded_cents ?? 0,
      saleSource: inferSaleSource({ totalCents, platformFeeCents }),
      hasAffiliate: Boolean(order.affiliate_relationship_id || affiliateCommissionCents > 0),
      createdAt: order.created_at,
      storeId: order.store_id,
      storeSlug: store?.slug ?? null,
      storeName: store?.name ?? null,
      productId: order.product_id ?? item?.productId ?? null,
      productName: order.product_title_snapshot ?? item?.title ?? 'Order',
      stripeSessionId: order.stripe_session_id,
      stripePaymentIntentId: order.stripe_payment_intent_id,
    }
  })

  if (options?.q) {
    const needle = options.q.toLowerCase()
    orders = orders.filter((o) =>
      o.id.toLowerCase().includes(needle)
      || (o.buyerEmail?.toLowerCase().includes(needle) ?? false)
      || (o.buyerName?.toLowerCase().includes(needle) ?? false)
      || o.productName.toLowerCase().includes(needle)
      || (o.storeName?.toLowerCase().includes(needle) ?? false),
    )
  }

  if (options?.filter === 'refunded') orders = orders.filter((o) => o.refundStatus === 'refunded')
  if (options?.filter === 'partial') orders = orders.filter((o) => o.refundStatus === 'partially_refunded')
  if (options?.filter === 'disputed') orders = orders.filter((o) => o.refundStatus === 'disputed')
  if (options?.filter === 'marketplace') orders = orders.filter((o) => o.saleSource === 'marketplace')
  if (options?.filter === 'direct') orders = orders.filter((o) => o.saleSource === 'direct')
  if (options?.filter === 'affiliate') orders = orders.filter((o) => o.hasAffiliate)
  if (options?.filter === 'free') orders = orders.filter((o) => o.saleSource === 'free')

  if (!options) return { orders, ...paginate(orders, 1, orders.length || 1) }
  const paged = paginate(orders, options.page, options.pageSize)
  return { orders: paged.items, ...paged }
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  const admin = getSupabaseAdminClient()
  const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error || !order) return null

  const [storeResult, purchaseResult, commissionResult, emailResult] = await Promise.all([
    admin.from('stores').select('id, slug, name').eq('id', order.store_id).maybeSingle(),
    admin.from('purchases').select('id, status').eq('order_id', orderId).maybeSingle(),
    admin.from('affiliate_commissions').select('commission_cents, status, commission_percent, relationship_id').eq('order_id', orderId).maybeSingle(),
    admin.from('transactional_email_deliveries').select('id').eq('order_id', orderId),
  ])

  const affiliateCommissionCents = commissionResult.data?.status === 'reversed'
    ? 0
    : commissionResult.data?.commission_cents ?? 0
  const totalCents = order.total_cents ?? 0
  const platformFeeCents = order.platform_fee_cents ?? 0

  const { orders } = await getAdminOrders()
  const summary = orders.find((o) => o.id === orderId)
  if (!summary) return null

  return {
    ...summary,
    subtotalCents: order.subtotal_cents ?? totalCents,
    purchaseId: purchaseResult.data?.id ?? null,
    purchaseStatus: purchaseResult.data?.status ?? null,
    affiliateRelationshipId: order.affiliate_relationship_id,
    emailDeliveryCount: emailResult.error ? 0 : (emailResult.data?.length ?? 0),
  }
}
