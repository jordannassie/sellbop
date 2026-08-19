import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { userCanManageStore } from './active-store'

export async function verifyProductManageAccess(productId: string, userId: string) {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('id, store_id')
    .eq('id', productId)
    .maybeSingle()

  if (!product) return null

  const canManage = await userCanManageStore(userId, product.store_id)
  if (!canManage) return null

  return { product }
}
