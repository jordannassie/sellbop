import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getPartnershipFinancialSummary, getPartnerOrderFinancials } from '@/lib/payments/partner-financials'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

  const { id } = await params

  try {
    const { getPartnershipDetail } = await import('@/lib/partnerships/queries')
    const detail = await getPartnershipDetail(id)
    if (!detail) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const storeId = detail.partnership.store_id
    const [summary, orders] = await Promise.all([
      getPartnershipFinancialSummary(id),
      getPartnerOrderFinancials(storeId, 25),
    ])

    return NextResponse.json({ summary, orders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load financials.'
    console.error('[GET /api/admin/partnerships/[id]/financials]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
