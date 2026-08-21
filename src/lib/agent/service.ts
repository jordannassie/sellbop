import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildStoragePath } from '@/lib/supabase/storage'
import { slugify } from '@/lib/utils'
import {
  ALLOWED_PRODUCT_FILE_TYPES,
  MAX_COVER_IMAGE_SIZE_BYTES,
  MAX_PRODUCT_FILE_SIZE_BYTES,
} from '@/lib/platform-config'
import { AgentAuthError, requireScope, type AgentIdentity } from './auth'
import { resolveStoreForOperation, resolveProductInShop } from './shop-access'
import { withActivityLog } from './activity-log'

import type { Database } from '@/lib/supabase/types'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export class AgentServiceError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

// ── get_store (legacy — returns resolved shop) ─────────────────────────────

export async function getStore(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'products:read')
  return resolveStoreForOperation(identity, shopId)
}

// ── get_products / get_product ────────────────────────────────────────────

export async function getProducts(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'products:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const admin = getSupabaseAdminClient()

  const { data: products, error } = await admin
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('sort_order', { ascending: true })

  if (error) throw new AgentServiceError(error.message, 500)
  return products ?? []
}

export async function getProduct(identity: AgentIdentity, productId: string, shopId?: string) {
  requireScope(identity, 'products:read')
  const { product } = await resolveProductInShop(identity, productId, shopId)

  const admin = getSupabaseAdminClient()
  const { data: files } = await admin
    .from('product_files')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return { product, files: files ?? [] }
}

// ── create_product ────────────────────────────────────────────────────────

export interface CreateProductInput {
  title: string
  shop_id?: string
  description?: string | null
  short_description?: string | null
  price_cents?: number | null
  cover_image_url?: string | null
  slug?: string | null
  category?: string | null
  is_live?: boolean
  marketplace_listing?: boolean
  affiliate_enabled?: boolean
  affiliate_commission_percent?: number | null
}

export async function createProduct(identity: AgentIdentity, input: CreateProductInput) {
  requireScope(identity, 'products:write')

  if (!input.title?.trim()) {
    throw new AgentServiceError('Product title is required.', 400)
  }

  return withActivityLog(identity, 'create_product', 'product', undefined, async () => {
    const store = await resolveStoreForOperation(identity, input.shop_id)
    const admin = getSupabaseAdminClient()

    const baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title)
    let slug = baseSlug || `product-${Date.now()}`
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await admin.from('products').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${i}`
    }

    const affiliateEnabled = input.affiliate_enabled ?? true

    const { data: product, error } = await admin
      .from('products')
      .insert({
        store_id: store.id,
        title: input.title.trim(),
        slug,
        product_type: 'digital_download',
        description: input.description?.trim() ?? null,
        short_description: input.short_description?.trim() ?? null,
        price_cents: input.price_cents ?? 0,
        cover_image_url: input.cover_image_url ?? null,
        // Agent-created products always start as drafts unless the caller
        // explicitly asks to publish — never silently go live.
        is_live: input.is_live ?? false,
        category: input.category ?? null,
        marketplace_listing: input.marketplace_listing ?? false,
        affiliate_enabled: affiliateEnabled,
        affiliate_commission_percent: affiliateEnabled ? (input.affiliate_commission_percent ?? 30) : null,
        affiliate_updated_at: affiliateEnabled ? new Date().toISOString() : null,
      })
      .select('*')
      .single()

    if (error) throw new AgentServiceError(error.message, 500)
    return { result: product, after: product, storeId: store.id }
  }, input.shop_id)
}

// ── update_product (generic — backs every set_/enable_/publish_ tool) ──────

export type ProductPatch = Partial<{
  title: string
  slug: string
  description: string | null
  short_description: string | null
  price_cents: number
  cover_image_url: string | null
  image_url: string | null
  is_live: boolean
  category: string | null
  marketplace_listing: boolean
  affiliate_enabled: boolean
  affiliate_commission_percent: number | null
  access_message: string | null
  checkout_copy: string | null
  sale_enabled: boolean
  sale_price_cents: number | null
}>

export async function updateProduct(identity: AgentIdentity, productId: string, patch: ProductPatch, shopId?: string) {
  const isAffiliateChange = 'affiliate_enabled' in patch || 'affiliate_commission_percent' in patch
  requireScope(identity, isAffiliateChange ? 'affiliates:write' : 'products:write')

  if (
    'affiliate_commission_percent' in patch &&
    patch.affiliate_commission_percent != null &&
    (patch.affiliate_commission_percent < 0 || patch.affiliate_commission_percent > 100)
  ) {
    throw new AgentServiceError('affiliate_commission_percent must be between 0 and 100.', 400)
  }

  return withActivityLog(identity, 'update_product', 'product', productId, async () => {
    const { product: before } = await resolveProductInShop(identity, productId, shopId)
    const admin = getSupabaseAdminClient()

    const update: ProductUpdate = { updated_at: new Date().toISOString() }

    if (patch.title !== undefined) update.title = patch.title
    if (patch.description !== undefined) update.description = patch.description
    if (patch.short_description !== undefined) update.short_description = patch.short_description
    if (patch.price_cents !== undefined) {
      if (patch.price_cents < 0) throw new AgentServiceError('price_cents cannot be negative.', 400)
      update.price_cents = patch.price_cents
    }
    if (patch.cover_image_url !== undefined) update.cover_image_url = patch.cover_image_url
    if (patch.image_url !== undefined) update.image_url = patch.image_url
    if (patch.is_live !== undefined) update.is_live = patch.is_live
    if (patch.category !== undefined) update.category = patch.category
    if (patch.marketplace_listing !== undefined) update.marketplace_listing = patch.marketplace_listing
    if (patch.access_message !== undefined) update.access_message = patch.access_message
    if (patch.checkout_copy !== undefined) update.checkout_copy = patch.checkout_copy
    if (patch.sale_enabled !== undefined) update.sale_enabled = patch.sale_enabled
    if (patch.sale_price_cents !== undefined) update.sale_price_cents = patch.sale_price_cents
    if (patch.affiliate_enabled !== undefined) {
      update.affiliate_enabled = patch.affiliate_enabled
      update.affiliate_updated_at = new Date().toISOString()
    }
    if (patch.affiliate_commission_percent !== undefined) {
      update.affiliate_commission_percent = patch.affiliate_commission_percent
    }

    if (patch.slug !== undefined) {
      let slug = slugify(patch.slug)
      for (let i = 1; i <= 10; i++) {
        const { data: existing } = await admin
          .from('products')
          .select('id')
          .eq('slug', slug)
          .neq('id', productId)
          .maybeSingle()
        if (!existing) break
        slug = `${slugify(patch.slug)}-${i}`
      }
      update.slug = slug
    }

    const { data: product, error } = await admin
      .from('products')
      .update(update)
      .eq('id', productId)
      .select('*')
      .single()

    if (error) throw new AgentServiceError(error.message, 500)
    return { result: product, before, after: product, storeId: before.store_id }
  }, shopId)
}

// ── File / image upload ─────────────────────────────────────────────────────

export interface UploadFileInput {
  fileName: string
  mimeType: string
  /** Base64-encoded file contents (no data: URL prefix). */
  base64Data: string
}

function decodeBase64(base64Data: string): Buffer {
  return Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64')
}

/** Uploads a downloadable product file to the private `product-files` bucket and registers it. */
export async function uploadProductFile(identity: AgentIdentity, productId: string, input: UploadFileInput) {
  requireScope(identity, 'files:write')

  if (!ALLOWED_PRODUCT_FILE_TYPES.includes(input.mimeType)) {
    throw new AgentServiceError(`File type "${input.mimeType}" is not allowed.`, 400)
  }

  return withActivityLog(identity, 'upload_product_file', 'product_file', productId, async () => {
    const { product, store } = await resolveProductInShop(identity, productId)
    const admin = getSupabaseAdminClient()

    const buffer = decodeBase64(input.base64Data)
    if (buffer.byteLength > MAX_PRODUCT_FILE_SIZE_BYTES) {
      throw new AgentServiceError('File exceeds the 100 MB limit.', 400)
    }

    const path = buildStoragePath(store.owner_user_id, input.fileName)
    const { error: uploadError } = await admin.storage
      .from('product-files')
      .upload(path, buffer, { contentType: input.mimeType, upsert: true })

    if (uploadError) throw new AgentServiceError(uploadError.message, 500)

    const { data: file, error } = await admin
      .from('product_files')
      .insert({
        product_id: productId,
        seller_id: store.owner_user_id,
        file_name: input.fileName,
        file_url: '',
        file_type: input.mimeType,
        file_size: buffer.byteLength,
        storage_path: path,
        upload_status: 'complete',
        visibility: 'buyers',
        sort_order: 0,
      })
      .select('*')
      .single()

    if (error) throw new AgentServiceError(error.message, 500)
    return { result: file, after: file, storeId: store.id }
  })
}

/** Registers metadata for a file already uploaded to storage by some other flow. */
export async function attachProductFile(
  identity: AgentIdentity,
  productId: string,
  input: { fileName: string; fileType: string; fileSize?: number; storagePath: string },
) {
  requireScope(identity, 'files:write')

  return withActivityLog(identity, 'attach_product_file', 'product_file', productId, async () => {
    const { store } = await resolveProductInShop(identity, productId)
    const admin = getSupabaseAdminClient()

    const { data: file, error } = await admin
      .from('product_files')
      .insert({
        product_id: productId,
        seller_id: store.owner_user_id,
        file_name: input.fileName,
        file_url: '',
        file_type: input.fileType,
        file_size: input.fileSize ?? null,
        storage_path: input.storagePath,
        upload_status: 'complete',
        visibility: 'buyers',
        sort_order: 0,
      })
      .select('*')
      .single()

    if (error) throw new AgentServiceError(error.message, 500)
    return { result: file, after: file, storeId: store.id }
  })
}

/** Uploads a cover/promotional image to the public `product-images` bucket. */
export async function uploadProductImage(
  identity: AgentIdentity,
  productId: string,
  input: UploadFileInput & { setPrimary?: boolean },
) {
  requireScope(identity, 'files:write')

  if (!input.mimeType.startsWith('image/')) {
    throw new AgentServiceError(`"${input.mimeType}" is not an image type.`, 400)
  }

  return withActivityLog(identity, 'upload_product_image', 'product', productId, async () => {
    const { product: before, store } = await resolveProductInShop(identity, productId)
    const admin = getSupabaseAdminClient()

    const buffer = decodeBase64(input.base64Data)
    if (buffer.byteLength > MAX_COVER_IMAGE_SIZE_BYTES) {
      throw new AgentServiceError('Image exceeds the 5 MB limit.', 400)
    }

    const path = buildStoragePath(store.owner_user_id, input.fileName)
    const { error: uploadError } = await admin.storage
      .from('product-images')
      .upload(path, buffer, { contentType: input.mimeType, upsert: true })

    if (uploadError) throw new AgentServiceError(uploadError.message, 500)

    const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)
    const imageUrl = urlData.publicUrl

    let product = before
    if (input.setPrimary ?? true) {
      const { data: updated, error } = await admin
        .from('products')
        .update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select('*')
        .single()
      if (error) throw new AgentServiceError(error.message, 500)
      product = updated
    }

    return { result: { url: imageUrl, path, product }, before, after: product, storeId: store.id }
  })
}

export async function setPrimaryProductImage(identity: AgentIdentity, productId: string, imageUrl: string) {
  return updateProduct(identity, productId, { cover_image_url: imageUrl })
}

// ── Convenience wrappers (thin, but keep the public tool surface explicit) ──

export const setProductDescription = (identity: AgentIdentity, productId: string, description: string) =>
  updateProduct(identity, productId, { description })

export const setProductPrice = (identity: AgentIdentity, productId: string, priceCents: number) =>
  updateProduct(identity, productId, { price_cents: priceCents })

export const enableAffiliates = (identity: AgentIdentity, productId: string, commissionPercent?: number) =>
  updateProduct(identity, productId, {
    affiliate_enabled: true,
    ...(commissionPercent !== undefined ? { affiliate_commission_percent: commissionPercent } : {}),
  })

export const disableAffiliates = (identity: AgentIdentity, productId: string) =>
  updateProduct(identity, productId, { affiliate_enabled: false })

export const setAffiliateCommission = (identity: AgentIdentity, productId: string, percent: number) =>
  updateProduct(identity, productId, { affiliate_commission_percent: percent })

export const saveProductAsDraft = (identity: AgentIdentity, productId: string) =>
  updateProduct(identity, productId, { is_live: false })

export const publishProduct = (identity: AgentIdentity, productId: string) =>
  updateProduct(identity, productId, { is_live: true })

export const unpublishProduct = (identity: AgentIdentity, productId: string) =>
  updateProduct(identity, productId, { is_live: false })
