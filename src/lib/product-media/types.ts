export type ProductMediaType = 'image' | 'video_link'

export type ProductMediaProvider = 'upload' | 'youtube' | 'loom' | 'vimeo' | 'wistia'

export interface ProductMediaItem {
  id: string
  product_id?: string
  media_type: ProductMediaType
  url: string
  thumbnail_url: string | null
  provider: ProductMediaProvider
  storage_path?: string | null
  sort_order: number
  embed_url?: string | null
}

export interface PendingProductMediaItem {
  id: string
  media_type: ProductMediaType
  url: string
  thumbnail_url: string | null
  provider: ProductMediaProvider
  storage_path?: string | null
  sort_order: number
  embed_url?: string | null
}
