// ============================================================
// POST /api/printify/sync
// Fetches products from Printify (real or mock) and returns
// normalized SellBop Products. The client saves them to localStorage.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { getTokenFromRequest, getShopIdFromRequest, hasTokenFromRequest, fetchProducts } from '@/lib/printify/client'
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/printify/mock-data'
import { normalizePrintifyProduct } from '@/lib/printify/normalize'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const shopIdOverride = body.shopId as string | undefined

    if (!hasTokenFromRequest(req)) {
      // Demo/mock fallback
      const demoShopId = String(MOCK_SHOPS[0].id)
      const normalized = MOCK_PRODUCTS.map(p =>
        normalizePrintifyProduct(p, demoShopId, DEMO_SELLER_PROFILE.id),
      )
      return NextResponse.json({ products: normalized, count: normalized.length, shopId: demoShopId, demo: true })
    }

    const token  = getTokenFromRequest(req)!
    const shopId = getShopIdFromRequest(req, shopIdOverride)

    if (!shopId) {
      return NextResponse.json({ error: 'No shop selected. Please select a shop and try again.' }, { status: 400 })
    }

    const page     = await fetchProducts(token, shopId)
    const normalized = page.data.map(p =>
      normalizePrintifyProduct(p, shopId, DEMO_SELLER_PROFILE.id),
    )

    return NextResponse.json({
      products: normalized,
      count: normalized.length,
      shopId,
      demo: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
