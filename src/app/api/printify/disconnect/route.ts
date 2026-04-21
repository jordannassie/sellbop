// ============================================================
// POST /api/printify/disconnect
// Clears the demo session cookies, returning to mock/env mode.
// ============================================================

import { NextResponse } from 'next/server'
import { COOKIE_TOKEN, COOKIE_SHOP } from '@/lib/printify/client'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_TOKEN)
  response.cookies.delete(COOKIE_SHOP)
  return response
}
