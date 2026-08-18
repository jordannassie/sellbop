import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { paginate, type AdminPaginationParams } from '@/lib/admin/helpers'

export interface AdminBuyerSummary {
  key: string
  email: string
  name: string | null
  buyerUserId: string | null
  isGuest: boolean
  emailVerified: boolean | null
  purchaseCount: number
  orderCount: number
  totalSpentCents: number
  lastPurchaseAt: string | null
  firstPurchaseAt: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getAdminBuyers(options?: AdminPaginationParams) {
  const admin = getSupabaseAdminClient()
  const [ordersResult, purchasesResult, profilesResult] = await Promise.all([
    admin.from('orders').select('id, buyer_email, buyer_name, buyer_user_id, total_cents, payment_status, created_at'),
    admin.from('purchases').select('buyer_email, buyer_user_id, created_at, status'),
    admin.from('profiles').select('user_id, email, full_name'),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (purchasesResult.error) throw purchasesResult.error
  if (profilesResult.error) throw profilesResult.error

  const profileByUserId = new Map((profilesResult.data ?? []).map((p) => [p.user_id, p]))
  const profileByEmail = new Map((profilesResult.data ?? []).map((p) => [normalizeEmail(p.email), p]))
  const buyers = new Map<string, AdminBuyerSummary>()

  function upsertBuyer(params: {
    email: string
    name?: string | null
    userId?: string | null
    spentCents?: number
    at?: string
    purchase?: boolean
    order?: boolean
  }) {
    const email = normalizeEmail(params.email)
    if (!email) return
    const existing = buyers.get(email) ?? {
      key: encodeURIComponent(email),
      email,
      name: params.name ?? null,
      buyerUserId: params.userId ?? null,
      isGuest: !params.userId,
      emailVerified: null,
      purchaseCount: 0,
      orderCount: 0,
      totalSpentCents: 0,
      lastPurchaseAt: null,
      firstPurchaseAt: null,
    }

    if (params.name && !existing.name) existing.name = params.name
    if (params.userId) {
      existing.buyerUserId = params.userId
      existing.isGuest = false
    }
    if (params.purchase) existing.purchaseCount += 1
    if (params.order) existing.orderCount += 1
    if (params.spentCents) existing.totalSpentCents += params.spentCents
    if (params.at) {
      if (!existing.lastPurchaseAt || new Date(params.at) > new Date(existing.lastPurchaseAt)) {
        existing.lastPurchaseAt = params.at
      }
      if (!existing.firstPurchaseAt || new Date(params.at) < new Date(existing.firstPurchaseAt)) {
        existing.firstPurchaseAt = params.at
      }
    }

    buyers.set(email, existing)
  }

  for (const order of ordersResult.data ?? []) {
    if (!order.buyer_email) continue
    upsertBuyer({
      email: order.buyer_email,
      name: order.buyer_name,
      userId: order.buyer_user_id,
      spentCents: order.payment_status === 'paid' ? order.total_cents : 0,
      at: order.created_at,
      order: true,
    })
  }

  for (const purchase of purchasesResult.data ?? []) {
    if (purchase.status !== 'active') continue
    upsertBuyer({
      email: purchase.buyer_email,
      userId: purchase.buyer_user_id,
      at: purchase.created_at,
      purchase: true,
    })
  }

  let list = Array.from(buyers.values()).sort((a, b) => {
    const aDate = a.lastPurchaseAt ?? a.firstPurchaseAt ?? ''
    const bDate = b.lastPurchaseAt ?? b.firstPurchaseAt ?? ''
    return bDate.localeCompare(aDate)
  })

  for (const buyer of list) {
    const profile = buyer.buyerUserId
      ? profileByUserId.get(buyer.buyerUserId)
      : profileByEmail.get(buyer.email)
    if (profile) {
      buyer.name = buyer.name ?? profile.full_name
      buyer.isGuest = false
      buyer.buyerUserId = profile.user_id
    }
  }

  if (options?.q) {
    const needle = options.q.toLowerCase()
    list = list.filter((b) =>
      b.email.toLowerCase().includes(needle)
      || (b.name?.toLowerCase().includes(needle) ?? false)
      || (b.buyerUserId?.toLowerCase().includes(needle) ?? false),
    )
  }

  if (options?.filter === 'guest') list = list.filter((b) => b.isGuest)
  if (options?.filter === 'account') list = list.filter((b) => !b.isGuest)

  if (!options) return { buyers: list, ...paginate(list, 1, list.length || 1) }
  const paged = paginate(list, options.page, options.pageSize)
  return { buyers: paged.items, ...paged }
}

export async function getAdminBuyerByEmail(encodedEmail: string) {
  const email = decodeURIComponent(encodedEmail)
  const { buyers } = await getAdminBuyers()
  return buyers.find((b) => b.email === normalizeEmail(email)) ?? null
}

export async function getAdminBuyerDetail(encodedEmail: string) {
  const buyer = await getAdminBuyerByEmail(encodedEmail)
  if (!buyer) return null

  const admin = getSupabaseAdminClient()
  const [ordersResult, purchasesResult] = await Promise.all([
    admin.from('orders').select('*').ilike('buyer_email', buyer.email).order('created_at', { ascending: false }),
    admin.from('purchases').select('id, product_id, order_id, status, created_at').ilike('buyer_email', buyer.email).order('created_at', { ascending: false }),
  ])

  return {
    buyer,
    orders: ordersResult.data ?? [],
    purchases: (purchasesResult.data ?? []).map((p) => ({
      id: p.id,
      productId: p.product_id,
      orderId: p.order_id,
      status: p.status,
      createdAt: p.created_at,
    })),
  }
}
