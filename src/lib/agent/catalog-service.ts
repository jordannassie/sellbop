import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { loadProductMedia, syncCoverImageFromMedia } from '@/lib/product-media/server'
import { slugify } from '@/lib/utils'
import { requireScope, type AgentIdentity } from './auth'
import { resolveStoreForOperation, resolveProductInShop, AgentShopAccessError } from './shop-access'
import { withActivityLog } from './activity-log'
import { updateProduct } from './service'

export async function reorderProducts(
  identity: AgentIdentity,
  shopId: string | undefined,
  orderedProductIds: string[],
) {
  requireScope(identity, 'products:write')

  return withActivityLog(identity, 'reorder_products', 'store', shopId, async () => {
    const store = await resolveStoreForOperation(identity, shopId)
    const admin = getSupabaseAdminClient()

    for (let i = 0; i < orderedProductIds.length; i++) {
      const productId = orderedProductIds[i]
      const { data: product } = await admin
        .from('products')
        .select('store_id')
        .eq('id', productId)
        .maybeSingle()
      if (!product || product.store_id !== store.id) {
        throw new AgentShopAccessError(`Product ${productId} not found in this shop.`, 404)
      }
      await admin.from('products').update({ sort_order: i, updated_at: new Date().toISOString() }).eq('id', productId)
    }

    return {
      result: { shop_id: store.id, ordered: orderedProductIds },
      after: { ordered: orderedProductIds },
      storeId: store.id,
      summary: `Reordered ${orderedProductIds.length} products`,
    }
  }, shopId)
}

export async function duplicateProduct(identity: AgentIdentity, productId: string, shopId?: string) {
  requireScope(identity, 'products:write')

  return withActivityLog(identity, 'duplicate_product', 'product', productId, async () => {
    const { product, store } = await resolveProductInShop(identity, productId, shopId)
    const admin = getSupabaseAdminClient()

    const baseSlug = `${product.slug}-copy`
    let slug = baseSlug
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await admin.from('products').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${i}`
    }

    const { data: copy, error } = await admin
      .from('products')
      .insert({
        store_id: store.id,
        title: `${product.title} (Copy)`,
        slug,
        product_type: product.product_type,
        description: product.description,
        short_description: product.short_description,
        price_cents: product.price_cents,
        sale_enabled: product.sale_enabled,
        sale_price_cents: product.sale_price_cents,
        cover_image_url: product.cover_image_url,
        image_url: product.image_url,
        is_live: false,
        category: product.category,
        marketplace_listing: product.marketplace_listing,
        affiliate_enabled: product.affiliate_enabled,
        affiliate_commission_percent: product.affiliate_commission_percent,
        access_message: product.access_message,
        checkout_copy: product.checkout_copy,
        sort_order: (product.sort_order ?? 0) + 1,
      })
      .select('*')
      .single()

    if (error) throw new AgentShopAccessError(error.message, 500)
    return {
      result: copy,
      before: product,
      after: copy,
      storeId: store.id,
      summary: `Duplicated product as draft: ${copy.title}`,
    }
  }, shopId)
}

export async function listProductFiles(identity: AgentIdentity, productId: string, shopId?: string) {
  requireScope(identity, 'products:read')
  await resolveProductInShop(identity, productId, shopId)
  const admin = getSupabaseAdminClient()
  const { data: files } = await admin
    .from('product_files')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
  return files ?? []
}

export async function setProductSalePrice(
  identity: AgentIdentity,
  productId: string,
  salePriceCents: number,
  enabled = true,
  shopId?: string,
) {
  requireScope(identity, 'products:write')
  await resolveProductInShop(identity, productId, shopId)
  return updateProduct(identity, productId, {
    sale_enabled: enabled,
    sale_price_cents: salePriceCents,
  }, shopId)
}

export async function addProductGalleryImage(
  identity: AgentIdentity,
  productId: string,
  input: { fileName: string; mimeType: string; base64Data: string; setPrimary?: boolean },
  shopId?: string,
) {
  requireScope(identity, 'files:write')

  return withActivityLog(identity, 'add_product_gallery_image', 'product', productId, async () => {
    const { product, store } = await resolveProductInShop(identity, productId, shopId)
    const admin = getSupabaseAdminClient()

    if (!input.mimeType.startsWith('image/')) {
      throw new AgentShopAccessError('Only image files are supported.', 400)
    }

    const buffer = Buffer.from(input.base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64')
    const { buildStoragePath } = await import('@/lib/supabase/storage')
    const path = buildStoragePath(store.owner_user_id, input.fileName)

    const { error: uploadError } = await admin.storage
      .from('product-images')
      .upload(path, buffer, { contentType: input.mimeType, upsert: true })
    if (uploadError) throw new AgentShopAccessError(uploadError.message, 500)

    const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)
    const imageUrl = urlData.publicUrl

    const media = await loadProductMedia(productId)
    const sortOrder = media.length

    const { data: row, error } = await admin.from('product_media').insert({
      product_id: productId,
      seller_id: store.owner_user_id,
      media_type: 'image',
      url: imageUrl,
      thumbnail_url: imageUrl,
      provider: 'upload',
      storage_path: path,
      sort_order: sortOrder,
    }).select('*').single()

    if (error) throw new AgentShopAccessError(error.message, 500)

    if (input.setPrimary ?? sortOrder === 0) {
      await syncCoverImageFromMedia(productId)
    }

    return {
      result: row,
      after: row,
      storeId: store.id,
    }
  }, shopId)
}

export async function setPrimaryProductImageByUrl(
  identity: AgentIdentity,
  productId: string,
  imageUrl: string,
  shopId?: string,
) {
  requireScope(identity, 'products:write')
  await resolveProductInShop(identity, productId, shopId)
  return updateProduct(identity, productId, { cover_image_url: imageUrl })
}
