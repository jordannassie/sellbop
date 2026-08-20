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
import { userCanManageStore } from '@/lib/stores/active-store'
import { isMissingRelationError } from '@/lib/supabase/schema-compat'
import type { Database } from '@/lib/supabase/types'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type StoreRow = Database['public']['Tables']['stores']['Row']

export class AgentServiceError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

// ── Activity logging ──────────────────────────────────────────────────────

async function logActivity(params: {
  identity: AgentIdentity
  action: string
  targetType?: string
  targetId?: string
  before?: unknown
  after?: unknown
  status: 'ok' | 'error'
  errorMessage?: string
}) {
  const admin = getSupabaseAdminClient()
  await admin.from('agent_activity_log').insert({
    connection_id: params.identity.connectionId,
    user_id: params.identity.userId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    before: (params.before as Record<string, unknown> | undefined) ?? null,
    after: (params.after as Record<string, unknown> | undefined) ?? null,
    status: params.status,
    error_message: params.errorMessage ?? null,
  })
}

/** Wraps a service action: runs it, logs success/failure, re-throws on failure. */
async function withActivityLog<T>(
  identity: AgentIdentity,
  action: string,
  targetType: string,
  targetId: string | undefined,
  fn: () => Promise<{ result: T; before?: unknown; after?: unknown }>,
): Promise<T> {
  try {
    const { result, before, after } = await fn()
    await logActivity({ identity, action, targetType, targetId, before, after, status: 'ok' })
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await logActivity({ identity, action, targetType, targetId, status: 'error', errorMessage: message })
    throw err
  }
}

// ── Store resolution ──────────────────────────────────────────────────────

/** Resolve the store this identity is allowed to act on. Throws if none / mismatched. */
async function resolveStore(identity: AgentIdentity): Promise<StoreRow> {
  const admin = getSupabaseAdminClient()

  if (identity.storeId) {
    const canManage = await userCanManageStore(identity.userId, identity.storeId)
    if (!canManage) {
      throw new AgentAuthError('This connection is not authorized for this store.', 403)
    }
    const { data: store } = await admin
      .from('stores')
      .select('*')
      .eq('id', identity.storeId)
      .maybeSingle()
    if (!store) throw new AgentServiceError('Store not found.', 404)
    return store
  }

  const { data: memberships, error: memberError } = await admin
    .from('store_members')
    .select('stores(*)')
    .eq('user_id', identity.userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (memberError && !isMissingRelationError(memberError)) {
    console.error('[resolveStore] store_members query failed:', memberError.message)
    throw new AgentServiceError('Could not resolve shop access.', 500)
  }

  const fromMember = memberships?.[0]?.stores as StoreRow | null | undefined
  if (fromMember) return fromMember

  const { data: store } = await admin
    .from('stores')
    .select('*')
    .eq('owner_user_id', identity.userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!store) throw new AgentServiceError('No store found for this account.', 404)
  return store
}

/** Verify a product belongs to a store owned by this identity. Throws otherwise. */
async function resolveOwnedProduct(identity: AgentIdentity, productId: string): Promise<ProductRow> {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('*')
    .eq('id', productId)
    .maybeSingle()

  if (!product) throw new AgentServiceError('Product not found.', 404)

  const store = await resolveStore(identity)
  if (product.store_id !== store.id) throw new AgentServiceError('Product not found.', 404)

  return product
}

// ── get_store ──────────────────────────────────────────────────────────────

export async function getStore(identity: AgentIdentity) {
  requireScope(identity, 'products:read')
  return resolveStore(identity)
}

// ── get_products / get_product ────────────────────────────────────────────

export async function getProducts(identity: AgentIdentity) {
  requireScope(identity, 'products:read')
  const store = await resolveStore(identity)
  const admin = getSupabaseAdminClient()

  const { data: products, error } = await admin
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (error) throw new AgentServiceError(error.message, 500)
  return products ?? []
}

export async function getProduct(identity: AgentIdentity, productId: string) {
  requireScope(identity, 'products:read')
  const product = await resolveOwnedProduct(identity, productId)

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
    const store = await resolveStore(identity)
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
        marketplace_listing: input.marketplace_listing ?? true,
        affiliate_enabled: affiliateEnabled,
        affiliate_commission_percent: affiliateEnabled ? (input.affiliate_commission_percent ?? 30) : null,
        affiliate_updated_at: affiliateEnabled ? new Date().toISOString() : null,
      })
      .select('*')
      .single()

    if (error) throw new AgentServiceError(error.message, 500)
    return { result: product, after: product }
  })
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
}>

export async function updateProduct(identity: AgentIdentity, productId: string, patch: ProductPatch) {
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
    const before = await resolveOwnedProduct(identity, productId)
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
    return { result: product, before, after: product }
  })
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
    await resolveOwnedProduct(identity, productId)
    const store = await resolveStore(identity)
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
    return { result: file, after: file }
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
    await resolveOwnedProduct(identity, productId)
    const store = await resolveStore(identity)
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
    return { result: file, after: file }
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
    const before = await resolveOwnedProduct(identity, productId)
    const store = await resolveStore(identity)
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

    return { result: { url: imageUrl, path, product }, before, after: product }
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
