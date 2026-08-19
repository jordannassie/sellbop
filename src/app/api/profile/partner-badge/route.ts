import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getProfilePartnerFields } from '@/lib/admin/partner'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
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
    const admin = getSupabaseAdminClient()
    const { data: profile, error: loadError } = await admin
      .from('profiles')
      .select('is_partner')
      .eq('user_id', userId)
      .maybeSingle()

    if (loadError) throw loadError
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }
    if (profile.is_partner !== true) {
      return NextResponse.json({ error: 'Partner badge is not available for this account.' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('profiles')
      .update({
        show_partner_badge: showPartnerBadge,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('is_partner, show_partner_badge')
      .single()

    if (error) throw error

    return NextResponse.json({
      isPartner: data.is_partner === true,
      showPartnerBadge: data.show_partner_badge !== false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update partner badge preference.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
