import { NextResponse, type NextRequest } from 'next/server'
import { getTokenFromRequest, getShopIdFromRequest, hasTokenFromRequest, fetchProducts } from '@/lib/printify/client'
import { MOCK_PRODUCTS_PAGE } from '@/lib/printify/mock-data'

export async function GET(req: NextRequest) {
  const shopIdParam = req.nextUrl.searchParams.get('shopId')
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')

  try {
    if (!hasTokenFromRequest(req)) {
      return NextResponse.json({ ...MOCK_PRODUCTS_PAGE, demo: true })
    }

    const token  = getTokenFromRequest(req)!
    const shopId = getShopIdFromRequest(req, shopIdParam)

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    const result = await fetchProducts(token, shopId, page)
    return NextResponse.json({ ...result, demo: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
