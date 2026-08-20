import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { getCurrentFinancialTerms } from '@/lib/partnerships/financial-terms'
import { resolveActiveStoreForUser } from '@/lib/stores/active-store'

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ partnership: null })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const activeStore = await resolveActiveStoreForUser(user.id)
  const storeId = activeStore?.id
  if (!storeId) return NextResponse.json({ partnership: null })

  const partnership = await getPartnershipByStoreId(storeId)
  if (!partnership) return NextResponse.json({ partnership: null })

  const terms = await getCurrentFinancialTerms(partnership.id)

  return NextResponse.json({
    partnership: {
      id: partnership.id,
      status: partnership.status,
      partnerUserId: partnership.partner_user_id,
      isPartnerOwner: partnership.partner_user_id === user.id,
    },
    terms: terms ? {
      id: terms.id,
      partnerShareBps: terms.partner_share_bps,
      acceptedAt: terms.accepted_at,
      version: terms.version,
    } : null,
  })
}
