import { NextResponse } from 'next/server'
import { fetchHomeCards } from '@/lib/resources/fetch'

export async function GET() {
  const cards = await fetchHomeCards()
  return NextResponse.json({ cards })
}
