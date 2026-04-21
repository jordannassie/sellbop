import { NextResponse, type NextRequest } from 'next/server'
import { hasPrintifyToken, fetchProducts } from '@/lib/printify/client'
import { MOCK_PRODUCTS_PAGE } from '@/lib/printify/mock-data'

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get('shopId') ?? process.env.PRINTIFY_SHOP_ID
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')

  try {
    if (!hasPrintifyToken()) {
      return NextResponse.json({ ...MOCK_PRODUCTS_PAGE, demo: true })
    }

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    const result = await fetchProducts(shopId, page)
    return NextResponse.json({ ...result, demo: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
