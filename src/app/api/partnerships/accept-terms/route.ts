import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { acceptFinancialTerms } from '@/lib/partnerships/financial-terms'
import { PartnershipTermsError } from '@/lib/partnerships/financial-terms'

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { partnershipId?: string; termsId?: string }
  if (!body.partnershipId) {
    return NextResponse.json({ error: 'partnershipId is required.' }, { status: 400 })
  }

  try {
    const terms = await acceptFinancialTerms({
      partnershipId: body.partnershipId,
      userId: user.id,
      termsId: body.termsId,
    })
    return NextResponse.json({ ok: true, terms })
  } catch (err) {
    if (err instanceof PartnershipTermsError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
