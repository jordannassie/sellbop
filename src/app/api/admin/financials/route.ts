import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getPlatformFinancialSummary, listAdminPartnerFinancials } from '@/lib/payments/partner-financials'

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

  const url = new URL(request.url)
  const filter = url.searchParams.get('filter') ?? 'all'

  try {
    const [summary, rows] = await Promise.all([
      getPlatformFinancialSummary(),
      listAdminPartnerFinancials(filter === 'all' ? undefined : filter),
    ])
    return NextResponse.json({ summary, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load financials.'
    console.error('[GET /api/admin/financials]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
