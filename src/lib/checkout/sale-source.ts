import type { NextRequest } from 'next/server'

export const MARKETPLACE_ATTRIBUTION_COOKIE = 'sb_mp_checkout'
export const MARKETPLACE_ATTRIBUTION_MAX_AGE_SECONDS = 30 * 60

/** Cookie set by proxy when buyer lands on a product page from marketplace (?from=marketplace). */
export function marketplaceAttributionCookieValue(productSlug: string): string {
  return productSlug.trim().toLowerCase()
}

export function readMarketplaceAttributionSlug(request: Request | NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`${MARKETPLACE_ATTRIBUTION_COOKIE}=([^;]+)`))
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase()
  } catch {
    return match[1].trim().toLowerCase()
  }
}

/**
 * Marketplace fee applies only when:
 * - product is marketplace-listed
 * - server-set attribution cookie matches this product slug
 */
export function resolveSaleType(params: {
  productSlug: string
  marketplaceListing: boolean
  request: Request
}): 'direct' | 'marketplace' {
  if (!params.marketplaceListing) return 'direct'
  const attributedSlug = readMarketplaceAttributionSlug(params.request)
  if (!attributedSlug) return 'direct'
  return attributedSlug === params.productSlug.trim().toLowerCase()
    ? 'marketplace'
    : 'direct'
}
