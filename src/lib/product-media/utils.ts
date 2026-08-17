import type { ProductMediaItem } from './types'
import { getVideoEmbedUrl } from './video-url'

type MediaRow = {
  id: string
  product_id?: string
  media_type: string
  url: string
  thumbnail_url: string | null
  provider: string
  storage_path?: string | null
  sort_order: number
}

export function mapMediaRow(row: MediaRow): ProductMediaItem {
  const provider = row.provider as ProductMediaItem['provider']
  const item: ProductMediaItem = {
    id: row.id,
    product_id: row.product_id,
    media_type: row.media_type as ProductMediaItem['media_type'],
    url: row.url,
    thumbnail_url: row.thumbnail_url,
    provider,
    storage_path: row.storage_path ?? null,
    sort_order: row.sort_order,
  }
  if (item.media_type === 'video_link') {
    item.embed_url = getVideoEmbedUrl({ provider, url: row.url }) ?? null
  }
  return item
}

/** Include legacy cover_image_url when no media rows exist yet. */
export function withLegacyCoverMedia(
  media: ProductMediaItem[],
  coverImageUrl: string | null | undefined,
): ProductMediaItem[] {
  if (media.length > 0) return media.sort((a, b) => a.sort_order - b.sort_order)
  if (!coverImageUrl?.trim()) return []
  return [{
    id: 'legacy-cover',
    media_type: 'image',
    url: coverImageUrl,
    thumbnail_url: coverImageUrl,
    provider: 'upload',
    sort_order: 0,
  }]
}

/** First image URL in sort order — used for cover_image_url sync. */
export function getPrimaryImageUrl(media: ProductMediaItem[]): string | null {
  const firstImage = [...media]
    .sort((a, b) => a.sort_order - b.sort_order)
    .find(m => m.media_type === 'image')
  return firstImage?.url ?? null
}
