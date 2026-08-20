import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { resolveActiveStoreForUser, userCanManageStore } from '@/lib/stores/active-store'
import { getPartnerEarningsForStore, getPartnerOrderFinancials } from '@/lib/payments/partner-financials'

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const activeStore = await resolveActiveStoreForUser(user.id)
  if (!activeStore) return NextResponse.json({ error: 'No active shop.' }, { status: 404 })

  const canManage = await userCanManageStore(user.id, activeStore.id)
  if (!canManage) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const partnership = await getPartnershipByStoreId(activeStore.id)
  if (!partnership) {
    return NextResponse.json({ error: 'Not a Partner Shop.' }, { status: 404 })
  }

  try {
    const [summary, orders] = await Promise.all([
      getPartnerEarningsForStore(activeStore.id),
      getPartnerOrderFinancials(activeStore.id),
    ])
    return NextResponse.json({ summary, orders, partnershipStatus: partnership.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not load earnings.'
    console.error('[GET /api/partnerships/earnings]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
