// ============================================================
// POST /api/printify/sync
// Fetches Printify products and returns normalized SellBop products.
// Client-side saves them to localStorage via the demo repo.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { hasPrintifyToken, fetchProducts } from '@/lib/printify/client'
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/printify/mock-data'
import { normalizePrintifyProduct } from '@/lib/printify/normalize'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const shopId: string = body.shopId ?? process.env.PRINTIFY_SHOP_ID ?? String(MOCK_SHOPS[0].id)

    let rawProducts = MOCK_PRODUCTS
    let isDemo = true

    if (hasPrintifyToken()) {
      const page = await fetchProducts(shopId)
      rawProducts = page.data
      isDemo = false
    }

    const normalized = rawProducts.map(p =>
      normalizePrintifyProduct(p, String(shopId), DEMO_SELLER_PROFILE.id),
    )

    return NextResponse.json({
      products: normalized,
      count: normalized.length,
      shopId,
      demo: isDemo,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
