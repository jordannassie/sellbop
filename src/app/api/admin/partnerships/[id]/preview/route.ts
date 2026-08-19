import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { generatePreviewLink, PartnershipError } from '@/lib/partnerships/service'

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
    const result = await generatePreviewLink(id, admin.userId)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof PartnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
