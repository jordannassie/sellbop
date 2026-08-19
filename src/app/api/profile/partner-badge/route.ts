import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getProfilePartnerFields, setUserPartnerBadgeVisibility } from '@/lib/admin/partner'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const fields = await getProfilePartnerFields(userId)
    if (!fields) {
      return NextResponse.json({ isPartner: false, showPartnerBadge: true })
    }
    return NextResponse.json({
      isPartner: fields.isPartner,
      showPartnerBadge: fields.showPartnerBadge,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load partner settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let showPartnerBadge: boolean
  try {
    const body = await req.json() as { showPartnerBadge?: unknown }
    if (typeof body.showPartnerBadge !== 'boolean') {
      return NextResponse.json({ error: 'showPartnerBadge must be a boolean.' }, { status: 400 })
    }
    showPartnerBadge = body.showPartnerBadge
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const result = await setUserPartnerBadgeVisibility(userId, showPartnerBadge)
    return NextResponse.json({
      isPartner: result.isPartner,
      showPartnerBadge: result.showPartnerBadge,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update partner badge preference.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
