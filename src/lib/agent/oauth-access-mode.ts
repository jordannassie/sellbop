import 'server-only'

import { cookies } from 'next/headers'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  requireActiveStoreForUser,
  ActiveStoreError,
} from '@/lib/stores/active-store'
import { AGENT_ACCESS_MODE_COOKIE } from './constants'
import type { AgentAccessMode } from './auth'
import { parseAccessFromScope } from './oauth-access-scope'

export type PendingAgentAccess = {
  accessMode: AgentAccessMode
  storeId: string | null
}

/** Read the user's pending access-mode choice from the dashboard cookie. */
export async function readPendingAgentAccessMode(): Promise<AgentAccessMode> {
  const cookieStore = await cookies()
  const value = cookieStore.get(AGENT_ACCESS_MODE_COOKIE)?.value
  return value === 'all_managed_shops' ? 'all_managed_shops' : 'single_shop'
}

/** Resolve access mode + optional pinned store for OAuth / connection creation. */
export async function resolvePendingAgentAccess(userId: string): Promise<PendingAgentAccess> {
  const accessMode = await readPendingAgentAccessMode()

  if (accessMode === 'all_managed_shops') {
    return { accessMode, storeId: null }
  }

  try {
    const store = await requireActiveStoreForUser(userId)
    return { accessMode: 'single_shop', storeId: store.id }
  } catch (err) {
    if (!(err instanceof ActiveStoreError)) throw err
    const admin = getSupabaseAdminClient()
    const { data: owned } = await admin
      .from('stores')
      .select('id')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return { accessMode: 'single_shop', storeId: owned?.id ?? null }
  }
}

/** Fallback when token exchange has no browser cookie (always single_shop + first owned store). */
export async function resolveTokenExchangeAccessFallback(userId: string): Promise<PendingAgentAccess> {
  try {
    const store = await requireActiveStoreForUser(userId)
    return { accessMode: 'single_shop', storeId: store.id }
  } catch (err) {
    if (!(err instanceof ActiveStoreError)) throw err
    const admin = getSupabaseAdminClient()
    const { data: owned } = await admin
      .from('stores')
      .select('id')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return { accessMode: 'single_shop', storeId: owned?.id ?? null }
  }
}

/** Map stored OAuth auth-code fields to connection access settings. */
export function accessFromAuthCode(authCode: {
  access_mode?: string | null
  store_id?: string | null
  scope?: string | null
}, fallback: PendingAgentAccess): PendingAgentAccess {
  if (authCode.access_mode === 'all_managed_shops') {
    return { accessMode: 'all_managed_shops', storeId: null }
  }

  if (authCode.access_mode === 'single_shop') {
    return {
      accessMode: 'single_shop',
      storeId: authCode.store_id ?? fallback.storeId,
    }
  }

  const fromScope = parseAccessFromScope(authCode.scope)
  if (fromScope) return fromScope

  return fallback
}
