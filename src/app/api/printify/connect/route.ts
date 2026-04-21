// ============================================================
// POST /api/printify/connect
// Validates a Printify API token by fetching the shops list.
// On success, saves the token in an httpOnly cookie so it is
// never accessible to client-side JavaScript after submission.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_TOKEN, COOKIE_SHOP } from '@/lib/printify/client'
import type { PrintifyShop } from '@/lib/printify/types'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token: string  = (body.token ?? '').trim()
    const shopId: string = (body.shopId ?? '').trim()

    if (!token) {
      return NextResponse.json({ error: 'API token is required.' }, { status: 400 })
    }

    // Validate by hitting Printify's shops endpoint
    const printifyRes = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'SellBop/1.0',
      },
      cache: 'no-store',
    })

    if (!printifyRes.ok) {
      if (printifyRes.status === 401) {
        return NextResponse.json(
          { error: 'Invalid token — Printify rejected it. Double-check and try again.' },
          { status: 401 },
        )
      }
      const body = await printifyRes.text()
      return NextResponse.json(
        { error: `Printify error ${printifyRes.status}: ${body}` },
        { status: 502 },
      )
    }

    const shops = (await printifyRes.json()) as PrintifyShop[]

    // Determine which shop to auto-select
    const autoShopId =
      shopId ||
      (shops.length === 1 ? String(shops[0].id) : null)

    // Build response — never include the token in the body
    const response = NextResponse.json({
      success: true,
      shops,
      shopId: autoShopId,
      autoSelected: shops.length === 1,
    })

    // Save token in httpOnly cookie
    response.cookies.set(COOKIE_TOKEN, token, COOKIE_OPTS)

    // Save shop ID if we have one
    if (autoShopId) {
      response.cookies.set(COOKIE_SHOP, autoShopId, COOKIE_OPTS)
    }

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Connection failed: ${message}` }, { status: 500 })
  }
}
