// ============================================================
// GET /api/printify/status
// Returns the current Printify connection status without
// ever exposing the token in the response body.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_TOKEN, COOKIE_SHOP } from '@/lib/printify/client'

export async function GET(req: NextRequest) {
  const hasCookieToken = Boolean(req.cookies.get(COOKIE_TOKEN)?.value)
  const cookieShopId   = req.cookies.get(COOKIE_SHOP)?.value ?? null
  const hasEnvToken    = Boolean(process.env.PRINTIFY_API_TOKEN)
  const envShopId      = process.env.PRINTIFY_SHOP_ID ?? null

  if (hasCookieToken) {
    return NextResponse.json({
      connected: true,
      source: 'session',    // demo session cookie
      shopId: cookieShopId,
    })
  }

  if (hasEnvToken) {
    return NextResponse.json({
      connected: true,
      source: 'env',        // Netlify env var
      shopId: envShopId,
    })
  }

  return NextResponse.json({
    connected: false,
    source: 'demo',         // no token — using mock data
    shopId: null,
  })
}
