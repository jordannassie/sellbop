import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured, env } from '@/lib/env'
import { getAccessibleStoresForUser, readActiveStoreIdFromCookie } from '@/lib/stores/active-store'
import { humanActionLabel } from '@/lib/agent/scope-labels'
import { CLAUDE_ECOM_SCOPES } from '@/lib/agent/auth'

import { AGENT_ACCESS_MODE_COOKIE } from '@/lib/agent/constants'

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const activeStoreId = await readActiveStoreIdFromCookie()

  const [connectionsResult, activityResult, shops] = await Promise.all([
    admin
      .from('agent_connections')
      .select('id, provider, name, token_prefix, scopes, access_mode, store_id, created_at, last_used_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('agent_activity_log')
      .select('id, connection_id, action, target_type, target_id, store_id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    getAccessibleStoresForUser(user.id),
  ])

  if (connectionsResult.error) {
    return NextResponse.json({ error: connectionsResult.error.message }, { status: 500 })
  }
  if (activityResult.error) {
    return NextResponse.json({ error: activityResult.error.message }, { status: 500 })
  }

  const storeMap = new Map(shops.map(s => [s.id, s.name]))
  const activeShop = shops.find(s => s.id === activeStoreId) ?? shops[0] ?? null

  let stripeStatus = null
  if (activeShop) {
    stripeStatus = {
      connected: !!activeShop.stripe_account_id,
      chargesEnabled: activeShop.stripe_charges_enabled,
      payoutsEnabled: activeShop.stripe_payouts_enabled,
      onboardingComplete: activeShop.stripe_onboarding_complete,
    }
  }

  const activity = (activityResult.data ?? []).map(a => ({
    id: a.id,
    action: a.action,
    actionLabel: humanActionLabel(a.action),
    targetType: a.target_type,
    targetId: a.target_id,
    storeId: a.store_id,
    storeName: a.store_id ? storeMap.get(a.store_id) ?? 'Shop' : null,
    status: a.status,
    createdAt: a.created_at,
  }))

  const activeConnections = (connectionsResult.data ?? []).filter(c => !c.revoked_at)
  const primary = activeConnections.find(c => c.provider === 'claude') ?? activeConnections[0] ?? null

  return NextResponse.json({
    mcpUrl: `${env.app.url}/api/mcp`,
    recommendedScopes: CLAUDE_ECOM_SCOPES,
    connections: connectionsResult.data ?? [],
    activeConnection: primary,
    shops: shops.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      role: s.role,
      isActive: s.id === activeShop?.id,
    })),
    activeShop: activeShop ? { id: activeShop.id, name: activeShop.name, slug: activeShop.slug } : null,
    stripeStatus,
    activity,
  })
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { access_mode?: 'single_shop' | 'all_managed_shops' }
  const mode = body.access_mode === 'all_managed_shops' ? 'all_managed_shops' : 'single_shop'

  const cookieStore = await cookies()
  cookieStore.set(AGENT_ACCESS_MODE_COOKIE, mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour — enough for OAuth round trip
  })

  return NextResponse.json({ ok: true, access_mode: mode })
}
