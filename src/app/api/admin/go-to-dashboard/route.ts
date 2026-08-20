import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { getAccessibleStoresForUser, syncActiveStoreCookieIfNeeded } from '@/lib/stores/active-store'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

/** Sync a valid active shop cookie, then redirect platform admins to the seller dashboard. */
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.redirect(new URL('/dashboard', env.app.url))
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) {
    return NextResponse.redirect(new URL('/login', env.app.url))
  }

  const stores = await getAccessibleStoresForUser(admin.userId)
  if (stores.length > 0) {
    await syncActiveStoreCookieIfNeeded(admin.userId)
  }

  return NextResponse.redirect(new URL('/dashboard', env.app.url))
}
