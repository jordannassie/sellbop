import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { switchActiveStoreForUser } from '@/lib/stores/active-store'
import { getPartnershipDetail } from '@/lib/partnerships/queries'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const detail = await getPartnershipDetail(id)
  if (!detail) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  try {
    const store = await switchActiveStoreForUser(admin.userId, detail.partnership.store_id)
    return NextResponse.json({ ok: true, storeId: store.id, redirectTo: '/dashboard' })
  } catch {
    return NextResponse.json({ error: 'Could not switch to this Shop.' }, { status: 403 })
  }
}
