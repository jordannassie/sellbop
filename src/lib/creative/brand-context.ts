import type { BrandContext } from './types'

interface ShopBrandHints {
  name?: string | null
  bio?: string | null
  headline?: string | null
}

interface ProductBrandHints {
  title?: string | null
  description?: string | null
  short_description?: string | null
}

export function buildImagePrompt(params: {
  userPrompt: string
  purpose: string
  brandContext?: BrandContext
  shop?: ShopBrandHints
  product?: ProductBrandHints
}): string {
  const parts: string[] = []

  const brand = params.brandContext
  const shopName = brand?.brand_name ?? params.shop?.name
  if (shopName) parts.push(`Brand: ${shopName}`)
  if (brand?.audience) parts.push(`Audience: ${brand.audience}`)
  if (params.product?.title) parts.push(`Product: ${params.product.title}`)
  if (params.product?.short_description || params.product?.description) {
    parts.push(`Context: ${(params.product.short_description ?? params.product.description ?? '').slice(0, 400)}`)
  }
  if (brand?.visual_direction) parts.push(`Visual direction: ${brand.visual_direction}`)
  if (brand?.photography_style) parts.push(`Photography style: ${brand.photography_style}`)
  if (brand?.image_mood) parts.push(`Mood: ${brand.image_mood}`)
  if (brand?.visual_motifs?.length) parts.push(`Motifs: ${brand.visual_motifs.join(', ')}`)
  if (brand?.tone) parts.push(`Tone: ${brand.tone}`)
  if (brand?.exclusions) parts.push(`Avoid: ${brand.exclusions}`)
  if (params.shop?.headline) parts.push(`Shop headline: ${params.shop.headline}`)

  parts.push(`Purpose: ${params.purpose}`)
  parts.push(`Creative brief: ${params.userPrompt}`)
  parts.push('Premium digital product marketing aesthetic. Clean, commercially sellable, cohesive brand look. No text overlays unless essential.')

  return parts.join('\n')
}

export function purposeLabel(imageType: string): string {
  const map: Record<string, string> = {
    product_cover: 'Square product cover art for a digital product storefront',
    lifestyle: 'Lifestyle supporting image for a digital product',
    mockup: 'Product mockup presentation image',
    supporting_image: 'Supporting catalog image matching the product brand',
    shop_banner: 'Wide ecommerce shop banner header',
  }
  return map[imageType] ?? 'Product marketing image'
}
