import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { mapMediaRow, getPrimaryImageUrl } from './utils'
import type { ProductMediaItem } from './types'

export async function loadProductMedia(productId: string): Promise<ProductMediaItem[]> {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return (data ?? []).map(mapMediaRow)
}

export async function syncCoverImageFromMedia(productId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient()
  const media = await loadProductMedia(productId)
  const coverUrl = getPrimaryImageUrl(media)
  await admin.from('products').update({ cover_image_url: coverUrl }).eq('id', productId)
  return coverUrl
}

export async function migrateLegacyCoverToMedia(
  productId: string,
  sellerId: string,
  coverImageUrl: string | null,
): Promise<void> {
  if (!coverImageUrl?.trim()) return

  const admin = getSupabaseAdminClient()
  const { count } = await admin
    .from('product_media')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if ((count ?? 0) > 0) return

  await admin.from('product_media').insert({
    product_id: productId,
    seller_id: sellerId,
    media_type: 'image',
    url: coverImageUrl,
    thumbnail_url: coverImageUrl,
    provider: 'upload',
    storage_path: null,
    sort_order: 0,
  })
}
