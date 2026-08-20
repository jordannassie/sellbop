import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { activatePartnerShop, getLaunchChecklist } from '@/lib/partnerships/activation'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }
  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const checklist = await getLaunchChecklist(id)
  return NextResponse.json({ checklist })
}

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
  try {
    const partnership = await activatePartnerShop(id, admin.userId)
    return NextResponse.json({ ok: true, partnership })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Activation failed.'
    const status = err instanceof Error && 'status' in err ? (err as { status: number }).status : 400
    return NextResponse.json({ error: message }, { status })
  }
}
