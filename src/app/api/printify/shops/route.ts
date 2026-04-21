import { NextResponse, type NextRequest } from 'next/server'
import { getTokenFromRequest, hasTokenFromRequest, fetchShops } from '@/lib/printify/client'
import { MOCK_SHOPS } from '@/lib/printify/mock-data'

export async function GET(req: NextRequest) {
  try {
    if (!hasTokenFromRequest(req)) {
      return NextResponse.json({ shops: MOCK_SHOPS, demo: true })
    }
    const token = getTokenFromRequest(req)!
    const shops = await fetchShops(token)
    return NextResponse.json({ shops, demo: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
