import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { userCanManageStore } from '@/lib/stores/active-store'
import { isMissingColumnError } from '@/lib/supabase/schema-compat'

function logMarketplaceError(
  requestId: string,
  message: string,
  details: {
    userId?: string
    storeId?: string
    code?: string | null
    pgMessage?: string
  },
) {
  console.error('[stores/marketplace]', {
    requestId,
    message,
    userId: details.userId ?? null,
    storeId: details.storeId ?? null,
    code: details.code ?? null,
    pgMessage: details.pgMessage ?? null,
  })
}

function migrationRequiredResponse(requestId: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'MIGRATION_REQUIRED',
        message: 'Marketplace settings require migration 037. Apply APPLY-037-MARKETPLACE-TOGGLES.sql in Supabase.',
      },
      requestId,
    },
    { status: 503 },
  )
}

// PATCH /api/stores/[id]/marketplace — update shop-level Marketplace visibility
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID().slice(0, 8)

  if (!isSupabaseAdminConfigured()) {
    logMarketplaceError(requestId, 'Supabase admin not configured', {})
    return NextResponse.json({ ok: false, error: { code: 'CONFIG', message: 'Database not configured.' }, requestId }, { status: 503 })
  }

  const { id: storeId } = await params

  let userId: string
  try {
    const userClient = await getSupabaseServerClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' }, requestId }, { status: 401 })
    }
    userId = user.id
  } catch (err) {
    logMarketplaceError(requestId, 'Session lookup failed', {
      storeId,
      pgMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { ok: false, error: { code: 'AUTH_UNAVAILABLE', message: 'Could not verify your session.' }, requestId },
      { status: 503 },
    )
  }

  const canManage = await userCanManageStore(userId, storeId)
  if (!canManage) {
    logMarketplaceError(requestId, 'Store manage access denied', { userId, storeId })
    return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Shop not found.' }, requestId }, { status: 404 })
  }

  let body: { marketplace_enabled?: unknown }
  try {
    body = await request.json() as { marketplace_enabled?: unknown }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_BODY', message: 'Invalid request body.' }, requestId },
      { status: 400 },
    )
  }

  if (typeof body.marketplace_enabled !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_BODY', message: 'marketplace_enabled must be a boolean.' }, requestId },
      { status: 400 },
    )
  }

  const admin = getSupabaseAdminClient()

  // Probe column before update so missing migration returns a clear error.
  const columnProbe = await admin.from('stores').select('marketplace_enabled').limit(1)
  if (columnProbe.error && isMissingColumnError(columnProbe.error)) {
    logMarketplaceError(requestId, 'stores.marketplace_enabled column missing', {
      userId,
      storeId,
      code: columnProbe.error.code,
      pgMessage: columnProbe.error.message,
    })
    return migrationRequiredResponse(requestId)
  }

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
    if (isMissingColumnError(error)) {
      logMarketplaceError(requestId, 'Update failed — column missing', {
        userId,
        storeId,
        code: error.code,
        pgMessage: error.message,
      })
      return migrationRequiredResponse(requestId)
    }

    logMarketplaceError(requestId, 'Supabase update failed', {
      userId,
      storeId,
      code: error.code,
      pgMessage: error.message,
    })
    return NextResponse.json(
      { ok: false, error: { code: 'UPDATE_FAILED', message: error.message }, requestId },
      { status: 500 },
    )
  }

  if (!store) {
    logMarketplaceError(requestId, 'Update returned no row', { userId, storeId })
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Shop not found.' }, requestId },
      { status: 404 },
    )
  }

  console.log('[stores/marketplace]', {
    requestId,
    userId,
    storeId,
    marketplace_enabled: store.marketplace_enabled,
    outcome: 'success',
  })

  return NextResponse.json({ ok: true, store, requestId })
}
