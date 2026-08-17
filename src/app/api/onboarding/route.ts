import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export interface OnboardingStatus {
  dismissed: boolean
  manual_steps: Record<string, boolean>
  auto: {
    create_product: boolean
    claude: boolean
    affiliates: boolean
  }
  completed_count: number
  total_steps: number
}

const TOTAL_STEPS = 5

async function getUserId() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function computeAutoSteps(userId: string) {
  const admin = getSupabaseAdminClient()

  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (!store) {
    return { create_product: false, claude: false, affiliates: false }
  }

  const [{ data: products }, { data: connections }] = await Promise.all([
    admin
      .from('products')
      .select('id, affiliate_enabled')
      .eq('store_id', store.id),
    admin
      .from('agent_connections')
      .select('id, provider, revoked_at')
      .eq('user_id', userId),
  ])

  const list = products ?? []
  const activeClaude = (connections ?? []).some(
    c => c.provider === 'claude' && !c.revoked_at,
  )

  return {
    create_product: list.length >= 1,
    claude: activeClaude,
    affiliates: list.some(p => p.affiliate_enabled === true),
  }
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      dismissed: false,
      manual_steps: {},
      auto: { create_product: false, claude: false, affiliates: false },
      completed_count: 0,
      total_steps: TOTAL_STEPS,
    } satisfies OnboardingStatus)
  }

  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  const auto = await computeAutoSteps(userId)

  const { data: row } = await admin
    .from('seller_onboarding')
    .select('dismissed, manual_steps')
    .eq('user_id', userId)
    .maybeSingle()

  const manual = (row?.manual_steps as Record<string, boolean>) ?? {}
  const dismissed = row?.dismissed ?? false

  const steps = [
    auto.create_product,
    auto.claude || manual.claude === true,
    manual.higgsfield === true,
    auto.affiliates,
    manual.share_store === true,
  ]
  const completed_count = steps.filter(Boolean).length

  return NextResponse.json({
    dismissed,
    manual_steps: manual,
    auto,
    completed_count,
    total_steps: TOTAL_STEPS,
  } satisfies OnboardingStatus)
}

export async function PATCH(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true })
  }

  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    dismissed?: boolean
    manual_steps?: Record<string, boolean>
  }

  const admin = getSupabaseAdminClient()

  const { data: existing } = await admin
    .from('seller_onboarding')
    .select('manual_steps, dismissed')
    .eq('user_id', userId)
    .maybeSingle()

  const manual_steps = {
    ...((existing?.manual_steps as Record<string, boolean>) ?? {}),
    ...(body.manual_steps ?? {}),
  }

  const { error } = await admin.from('seller_onboarding').upsert(
    {
      user_id: userId,
      dismissed: body.dismissed ?? existing?.dismissed ?? false,
      manual_steps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return GET()
}
