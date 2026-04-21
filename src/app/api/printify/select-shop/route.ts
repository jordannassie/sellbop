// ============================================================
// POST /api/printify/select-shop
// Saves a chosen shop ID to the demo session cookie.
// Called when the user picks a shop from the selector after connecting.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SHOP, COOKIE_TOKEN } from '@/lib/printify/client'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24,
  path: '/',
}

export async function POST(req: NextRequest) {
  const hasCookieToken = Boolean(req.cookies.get(COOKIE_TOKEN)?.value)
  const hasEnvToken    = Boolean(process.env.PRINTIFY_API_TOKEN)

  if (!hasCookieToken && !hasEnvToken) {
    return NextResponse.json({ error: 'Not connected.' }, { status: 401 })
  }

  const body   = await req.json()
  const shopId = (body.shopId ?? '').toString().trim()

  if (!shopId) {
    return NextResponse.json({ error: 'shopId is required.' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true, shopId })
  response.cookies.set(COOKIE_SHOP, shopId, COOKIE_OPTS)
  return response
}
