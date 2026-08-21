import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { userCanManageStore } from '@/lib/stores/active-store'
import { isMissingSchemaError } from '@/lib/supabase/schema-compat'

// PATCH /api/stores/[id]/marketplace — update shop-level Marketplace visibility
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: storeId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const canManage = await userCanManageStore(user.id, storeId)
  if (!canManage) {
    return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
  }

  const body = await request.json() as { marketplace_enabled?: unknown }
  if (typeof body.marketplace_enabled !== 'boolean') {
    return NextResponse.json({ error: 'marketplace_enabled must be a boolean.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data: store, error } = await admin
    .from('stores')
    .update({
      marketplace_enabled: body.marketplace_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)
    .select('id, marketplace_enabled')
    .single()

  if (error) {
    if (isMissingSchemaError(error)) {
      return NextResponse.json(
        { error: 'Marketplace settings are not available yet. Apply migration 037.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ store })
}
