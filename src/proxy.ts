import type { NextRequest } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase/proxy'
import {
  MARKETPLACE_ATTRIBUTION_COOKIE,
  MARKETPLACE_ATTRIBUTION_MAX_AGE_SECONDS,
  marketplaceAttributionCookieValue,
} from '@/lib/checkout/sale-source'

const RESERVED_TOP_LEVEL = new Set([
  'api', 'dashboard', 'checkout', 'login', 'signup', 'marketplace', 'pricing',
  'p', 'access', 'purchases', 'internal', 'auth', 'post-login', 'resources',
])

function productSlugFromPath(pathname: string): string | null {
  const legacy = pathname.match(/^\/p\/([^/]+)$/)
  if (legacy?.[1]) return legacy[1]

  const canonical = pathname.match(/^\/([^/]+)\/([^/]+)$/)
  if (!canonical) return null
  const [, sellerSlug, productSlug] = canonical
  if (RESERVED_TOP_LEVEL.has(sellerSlug)) return null
  return productSlug
}

export async function proxy(request: NextRequest) {
  const response = await updateSupabaseSession(request)

  if (request.nextUrl.searchParams.get('from') !== 'marketplace') {
    return response
  }

  const slug = productSlugFromPath(request.nextUrl.pathname)
  if (!slug) return response

  response.cookies.set(
    MARKETPLACE_ATTRIBUTION_COOKIE,
    marketplaceAttributionCookieValue(slug),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MARKETPLACE_ATTRIBUTION_MAX_AGE_SECONDS,
      path: '/',
    },
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
