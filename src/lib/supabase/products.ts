/**
 * Supabase product helpers — shared between dashboard pages.
 * All functions use the browser Supabase client (safe for client components).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import type { Product } from '@/lib/domain/entities'

type ProductRow = Database['public']['Tables']['products']['Row']

/** Map a Supabase products row to the Product domain entity. Price is kept in cents. */
export function mapSupabaseProduct(row: ProductRow, ownerId: string): Product {
  return {
    id:                   row.id,
    sellerId:             ownerId,
    name:                 row.title,
    slug:                 row.slug,
    description:          row.description ?? '',
    shortDescription:     row.short_description,
    productType:          row.product_type as Product['productType'],
    status:               row.is_live ? 'published' : 'draft',
    price:                row.price_cents ?? 0,     // cents, matching domain convention
    compareAtPrice:       null,
    currency:             'usd',
    thumbnailUrl:         row.cover_image_url ?? row.image_url,
    coverImageUrl:        row.cover_image_url,
    galleryImageUrls:     [],
    category:             null,
    tags:                 [],
    fileAssetIds:         [],
    externalUrl:          null,
    confirmationMessage:  null,
    supportEmail:         null,
    ctaText:              'Get Instant Access',
    seoTitle:             null,
    seoDescription:       null,
    licenseKeyEnabled:    false,
    memberAccessEnabled:  false,
    downloadLimit:        null,
    accessExpirationDays: null,
    variants:             [],
    salesCount:           0,
    viewCount:            0,
    publishedAt:          row.is_live ? row.created_at : null,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
    marketplaceVisible:   row.marketplace_visible ?? true,
    marketplaceExcerpt:   row.marketplace_excerpt,
  }
}

/**
 * Fetch all products belonging to the user's store.
 * Returns an empty array if no store or no products exist.
 */
export async function fetchUserProducts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Product[]> {
  const { data: stores } = await supabase
    .from('stores')
    .select('id, owner_user_id')
    .eq('owner_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  const store = stores?.[0]
  if (!store) return []

  const { data: rows } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (rows ?? []).map(r => mapSupabaseProduct(r, store.owner_user_id))
}

/**
 * Fetch a single product by ID.
 * Also resolves the owner (store.owner_user_id) for the sellerId field.
 */
export async function fetchProductById(
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<Product | null> {
  const { data: row } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .maybeSingle()

  if (!row) return null

  const { data: store } = await supabase
    .from('stores')
    .select('owner_user_id')
    .eq('id', row.store_id)
    .maybeSingle()

  return mapSupabaseProduct(row, store?.owner_user_id ?? '')
}

/**
 * Save (update) a Supabase product by its ID.
 * Returns an error message string, or null on success.
 */
export async function saveSupabaseProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  patch: {
    name?: string
    slug?: string
    description?: string
    shortDescription?: string | null
    productType?: string
    isLive?: boolean
    priceCents?: number
    thumbnailUrl?: string | null
    ctaText?: string
    externalUrl?: string | null
  },
): Promise<string | null> {
  const { error } = await supabase
    .from('products')
    .update({
      title:             patch.name,
      slug:              patch.slug,
      description:       patch.description,
      short_description: patch.shortDescription,
      product_type:      patch.productType,
      is_live:           patch.isLive,
      price_cents:       patch.priceCents,
      cover_image_url:   patch.thumbnailUrl,
      image_url:         patch.thumbnailUrl,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[saveSupabaseProduct]', error)
    }
    return 'Failed to save product.'
  }
  return null
}
