import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { getPartnershipDetail } from '@/lib/partnerships/queries'
import { sendPartnerInvite, PartnershipError } from '@/lib/partnerships/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = (await request.json()) as { partnerEmail?: string; partnerName?: string }

  try {
    const detail = await getPartnershipDetail(id)
    if (!detail) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const store = detail.store as { name: string } | null
    const email = body.partnerEmail?.trim() || detail.partnership.partner_email
    if (!email) {
      return NextResponse.json({ error: 'Partner email is required before sending an invite.' }, { status: 400 })
    }

    const result = await sendPartnerInvite({
      partnershipId: id,
      adminUserId: admin.userId,
      partnerEmail: email,
      partnerName: body.partnerName?.trim() || detail.partnership.partner_name || undefined,
      shopName: store?.name ?? 'Your Shop',
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    if (err instanceof PartnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
