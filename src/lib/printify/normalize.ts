// ============================================================
// Normalize Printify products into SellBop Product shape
//
// PRICING NOTE:
//   Printify's documented API returns variant `price` in cents (2499 = $24.99).
//   However some products/shops return the value already in dollars (27 = $27.00).
//   We use a heuristic: if price >= 100, treat as cents (divide by 100);
//   otherwise treat as already in dollars.  This covers both formats safely.
//   Never divide again in display code — use formatCurrency(price, currency).
// ============================================================

import type { PrintifyProduct } from './types'
import type { Product, ProductVariant } from '@/lib/domain/entities'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&reg;/g, '\u00AE')
    .replace(/&trade;/g, '\u2122')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function stripHtml(html: string): string {
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return decodeHtmlEntities(stripped)
}

/**
 * Convert a Printify variant price to dollars.
 * Printify's documented format is integer cents (2499 = $24.99), but some
 * shop/product responses return the value already in dollars (27 = $27.00).
 * Heuristic: >= 100 → cents; < 100 → already dollars.
 */
function toPrice(value: number): number {
  if (!value || value === 0) return 0
  return value >= 100 ? value / 100 : value
}

/**
 * Parse a Printify variant title into color + size.
 * Titles are typically "Color / Size", "Color / Color / Size", or just "Size".
 * We treat the LAST part as the size and everything before as color.
 */
function parseColorSize(title: string): { color: string | null; size: string | null } {
  if (!title || !title.includes(' / ')) {
    return { color: null, size: title.trim() || null }
  }
  const parts = title.split(' / ').map(s => s.trim())
  const size  = parts[parts.length - 1]
  const color = parts.length > 1 ? parts.slice(0, parts.length - 1).join(' / ') : null
  return { color, size }
}

/**
 * Find the best image for a variant based on variant_ids mapping.
 * Returns null if no variant-specific image is found.
 */
function imageForVariant(
  images: PrintifyProduct['images'],
  variantId: number,
): string | null {
  return images.find(img => img.variant_ids.includes(variantId))?.src ?? null
}

export function normalizePrintifyProduct(
  p: PrintifyProduct,
  shopId: string,
  sellerId: string,
  existingId?: string,
): Product {
  const enabledVariants = p.variants.filter(v => v.is_enabled)

  // ── Pricing: convert to dollars via toPrice() (handles cents or dollars) ──
  const defaultVariant = enabledVariants.find(v => v.is_default) ?? enabledVariants[0]
  const prices         = enabledVariants.map(v => v.price)
  const minPrice       = prices.length ? Math.min(...prices) : 0
  const defaultPrice   = toPrice(defaultVariant?.price ?? minPrice)

  // ── Images ──────────────────────────────────────────────────────────────
  const defaultImage  = p.images.find(i => i.is_default) ?? p.images[0]
  const galleryImages = p.images.filter(i => !i.is_default).slice(0, 4).map(i => i.src)

  // ── Identifiers ──────────────────────────────────────────────────────────
  const slug = slugify(p.title) + '-' + p.id.slice(-6)
  const id   = existingId ?? `printify-${p.id}`
  const now  = new Date().toISOString()

  // ── Normalized variants (with color/size parsed) ──────────────────────
  const variants: ProductVariant[] = enabledVariants.map(v => {
    const { color, size } = parseColorSize(v.title)
    return {
      id:               `pv-${v.id}`,
      productId:        id,
      name:             v.title,
      price:            toPrice(v.price), // cents or dollars → dollars
      compareAtPrice:   null,
      sku:              v.sku || null,
      description:      null,
      color,
      size,
      printifyVariantId: v.id,           // raw Printify numeric ID for order creation
      isAvailable:      true,
    }
  })

  const cleanDescription  = stripHtml(p.description || p.title)
  const shortDescription  = cleanDescription.slice(0, 140) || null

  return {
    id,
    sellerId,
    name: p.title,
    slug,
    description: cleanDescription || p.title,
    shortDescription,
    productType: 'digital_download',  // kept for entity compatibility; source='printify' is the real signal
    status: p.visible ? 'published' : 'draft',
    price:          defaultPrice,
    compareAtPrice: null,
    currency: 'USD',
    thumbnailUrl:    defaultImage?.src ?? null,
    coverImageUrl:   defaultImage?.src ?? null,
    galleryImageUrls: galleryImages,
    category: 'clothing',
    tags: p.tags ?? [],
    fileAssetIds: [],
    externalUrl: null,
    confirmationMessage: 'Your order will be fulfilled by Printify and shipped directly to you.',
    supportEmail: null,
    ctaText: 'Buy Now',
    seoTitle: p.title,
    seoDescription: shortDescription,
    licenseKeyEnabled: false,
    memberAccessEnabled: false,
    downloadLimit: null,
    accessExpirationDays: null,
    variants,
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

// ── Helpers for display ───────────────────────────────────────

/** Returns the minimum price across enabled variants (in dollars). */
export function printifyMinPrice(variants: ProductVariant[]): number {
  if (!variants.length) return 0
  return Math.min(...variants.map(v => v.price))
}

/** Returns the maximum price across enabled variants (in dollars). */
export function printifyMaxPrice(variants: ProductVariant[]): number {
  if (!variants.length) return 0
  return Math.max(...variants.map(v => v.price))
}

/** True when variants have more than one unique price. */
export function printifyHasPriceRange(variants: ProductVariant[]): boolean {
  const prices = [...new Set(variants.map(v => v.price))]
  return prices.length > 1
}

/** Unique colors available across all variants. */
export function printifyColors(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map(v => v.color).filter(Boolean) as string[])]
}

/** Sizes available for a given color (or all sizes if no color filtering). */
export function printifySizes(variants: ProductVariant[], color?: string | null): string[] {
  const filtered = color ? variants.filter(v => v.color === color) : variants
  return [...new Set(filtered.map(v => v.size ?? v.name).filter(Boolean))]
}

/** Find the best image src for a variant ID, falling back to the product default. */
export { imageForVariant }
