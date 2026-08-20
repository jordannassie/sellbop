import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { createNewFinancialTermsVersion, listFinancialTermsVersions } from '@/lib/partnerships/financial-terms'
import { PartnershipTermsError } from '@/lib/partnerships/financial-terms'

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
  const terms = await listFinancialTermsVersions(id)
  return NextResponse.json({ terms })
}

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
  const body = (await request.json()) as { partnerShareBps?: number }
  const bps = body.partnerShareBps ?? 5000

  try {
    const terms = await createNewFinancialTermsVersion({
      partnershipId: id,
      adminUserId: admin.userId,
      partnerShareBps: bps,
    })
    return NextResponse.json({ terms })
  } catch (err) {
    if (err instanceof PartnershipTermsError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
