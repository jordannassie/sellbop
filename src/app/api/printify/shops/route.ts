import { NextResponse } from 'next/server'
import { hasPrintifyToken, fetchShops } from '@/lib/printify/client'
import { MOCK_SHOPS } from '@/lib/printify/mock-data'

export async function GET() {
  try {
    if (!hasPrintifyToken()) {
      return NextResponse.json({ shops: MOCK_SHOPS, demo: true })
    }
    const shops = await fetchShops()
    return NextResponse.json({ shops, demo: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
