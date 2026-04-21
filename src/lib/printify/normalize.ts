// ============================================================
// Normalize Printify products into SellBop Product shape
// ============================================================

import type { PrintifyProduct } from './types'
import type { Product } from '@/lib/domain/entities'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizePrintifyProduct(
  p: PrintifyProduct,
  shopId: string,
  sellerId: string,
  existingId?: string,
): Product {
  const enabledVariants = p.variants.filter(v => v.is_enabled)
  const defaultVariant = enabledVariants.find(v => v.is_default) ?? enabledVariants[0]
  const priceInCents = defaultVariant?.price ?? 0
  const price = priceInCents / 100

  const defaultImage = p.images.find(i => i.is_default) ?? p.images[0]
  const galleryImages = p.images.slice(1, 5).map(i => i.src)

  const slug = slugify(p.title) + '-' + p.id.slice(-6)
  const id = existingId ?? `printify-${p.id}`

  const now = new Date().toISOString()

  return {
    id,
    sellerId,
    name: p.title,
    slug,
    description: p.description || p.title,
    shortDescription: p.description?.replace(/<[^>]+>/g, '').slice(0, 120) ?? null,
    productType: 'digital_download',
    status: p.visible ? 'published' : 'draft',
    price,
    compareAtPrice: null,
    currency: 'USD',
    thumbnailUrl: defaultImage?.src ?? null,
    coverImageUrl: defaultImage?.src ?? null,
    galleryImageUrls: galleryImages,
    category: 'clothing',
    tags: p.tags ?? [],
    fileAssetIds: [],
    externalUrl: null,
    confirmationMessage: 'Your order will be fulfilled by Printify and shipped directly to you.',
    supportEmail: null,
    ctaText: 'Buy Now',
    seoTitle: p.title,
    seoDescription: p.description?.replace(/<[^>]+>/g, '').slice(0, 160) ?? null,
    licenseKeyEnabled: false,
    memberAccessEnabled: false,
    downloadLimit: null,
    accessExpirationDays: null,
    variants: enabledVariants.map(v => ({
      id: `pv-${v.id}`,
      productId: id,
      name: v.title,
      price: v.price / 100,
      compareAtPrice: null,
      sku: v.sku || null,
      description: null,
    })),
    salesCount: 0,
    viewCount: 0,
    publishedAt: p.visible ? p.updated_at : null,
    createdAt: p.created_at || now,
    updatedAt: p.updated_at || now,
    marketplaceVisible: false,
    marketplaceExcerpt: null,
    // ── Printify-specific ────────────────────────────────────
    source: 'printify',
    printifyProductId: p.id,
    printifyShopId: shopId,
    fulfillmentProvider: 'printify',
    fulfillmentStatus: null,
  }
}
