import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAccessibleStoresForUser, userCanManageStore } from '@/lib/stores/active-store'
import { AgentAuthError, type AgentIdentity } from './auth'
import type { Database } from '@/lib/supabase/types'

type StoreRow = Database['public']['Tables']['stores']['Row']

export class AgentShopAccessError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

/** Resolve a store the identity may operate on. */
export async function resolveStoreForOperation(
  identity: AgentIdentity,
  shopId?: string | null,
): Promise<StoreRow> {
  const admin = getSupabaseAdminClient()

  if (identity.accessMode === 'single_shop') {
    const pinnedId = identity.storeId
    if (!pinnedId) {
      throw new AgentShopAccessError('This connection is not bound to a shop.', 403)
    }
    if (shopId && shopId !== pinnedId) {
      throw new AgentShopAccessError('This connection can only access its authorized shop.', 403)
    }
    const canManage = await userCanManageStore(identity.userId, pinnedId)
    if (!canManage) {
      throw new AgentAuthError('This connection is not authorized for this store.', 403)
    }
    const { data: store } = await admin.from('stores').select('*').eq('id', pinnedId).maybeSingle()
    if (!store) throw new AgentShopAccessError('Store not found.', 404)
    return store
  }

  // all_managed_shops
  const targetId = shopId ?? identity.storeId
  if (!targetId) {
    throw new AgentShopAccessError('shop_id is required when managing multiple shops.', 400)
  }

  const canManage = await userCanManageStore(identity.userId, targetId)
  if (!canManage) {
    throw new AgentAuthError('This connection is not authorized for this store.', 403)
  }

  const { data: store } = await admin.from('stores').select('*').eq('id', targetId).maybeSingle()
  if (!store) throw new AgentShopAccessError('Store not found.', 404)
  return store
}

export async function listAuthorizedShops(identity: AgentIdentity) {
  const stores = await getAccessibleStoresForUser(identity.userId)

  if (identity.accessMode === 'single_shop' && identity.storeId) {
    return stores.filter(s => s.id === identity.storeId)
  }

  return stores
}

export async function resolveProductInShop(
  identity: AgentIdentity,
  productId: string,
  shopId?: string | null,
) {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('*')
    .eq('id', productId)
    .maybeSingle()

  if (!product) throw new AgentShopAccessError('Product not found.', 404)

  const store = await resolveStoreForOperation(identity, shopId ?? product.store_id)
  if (product.store_id !== store.id) {
    throw new AgentShopAccessError('Product not found.', 404)
  }

  return { product, store }
}
