import { NextResponse } from 'next/server'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { retryPartnerTransfer } from '@/lib/payments/partner-settlement'

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })

  const body = (await request.json()) as { orderId?: string }
  if (!body.orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })
  }

  try {
    const result = await retryPartnerTransfer(body.orderId)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retry failed.'
    console.error('[POST /api/admin/financials/retry-transfer]', body.orderId, message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
