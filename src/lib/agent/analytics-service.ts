import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireScope, type AgentIdentity } from './auth'
import { resolveStoreForOperation, resolveProductInShop } from './shop-access'

export async function getShopSalesSummary(
  identity: AgentIdentity,
  shopId?: string,
  days = 30,
) {
  requireScope(identity, 'analytics:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const admin = getSupabaseAdminClient()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await admin
    .from('orders')
    .select('id, total_cents, payment_status, created_at, product_id')
    .eq('store_id', store.id)
    .eq('payment_status', 'paid')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  const paid = orders ?? []
  const revenueCents = paid.reduce((s, o) => s + (o.total_cents ?? 0), 0)
  const productIds = new Set(paid.map(o => o.product_id).filter(Boolean))

  return {
    shop_id: store.id,
    period_days: days,
    order_count: paid.length,
    revenue_cents: revenueCents,
    products_sold: productIds.size,
    currency: 'usd',
  }
}

export async function getProductSalesSummary(
  identity: AgentIdentity,
  productId: string,
  shopId?: string,
  days = 30,
) {
  requireScope(identity, 'analytics:read')
  const { product } = await resolveProductInShop(identity, productId, shopId)
  const admin = getSupabaseAdminClient()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await admin
    .from('orders')
    .select('id, total_cents, payment_status, created_at')
    .eq('product_id', product.id)
    .eq('payment_status', 'paid')
    .gte('created_at', since)

  const paid = orders ?? []
  return {
    product_id: product.id,
    product_title: product.title,
    period_days: days,
    units_sold: paid.length,
    revenue_cents: paid.reduce((s, o) => s + (o.total_cents ?? 0), 0),
    currency: 'usd',
  }
}
