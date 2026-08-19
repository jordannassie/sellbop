import { NextResponse } from 'next/server'
import { clearActiveStoreCookie } from '@/lib/stores/active-store'

/** POST /api/auth/logout — clear active shop cookie on sign-out */
export async function POST() {
  await clearActiveStoreCookie()
  return NextResponse.json({ ok: true })
}
