import 'server-only'

import type { AgentIdentity } from './auth'

export async function logActivity(params: {
  identity: AgentIdentity
  action: string
  targetType?: string
  targetId?: string
  storeId?: string | null
  before?: unknown
  after?: unknown
  status: 'ok' | 'error'
  errorMessage?: string
  summary?: string
}) {
  const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
  const admin = getSupabaseAdminClient()
  await admin.from('agent_activity_log').insert({
    connection_id: params.identity.connectionId,
    user_id: params.identity.userId,
    store_id: params.storeId ?? params.identity.storeId ?? null,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    before: (params.before as Record<string, unknown> | undefined) ?? null,
    after: params.after
      ? { ...(params.after as Record<string, unknown>), ...(params.summary ? { _summary: params.summary } : {}) }
      : (params.summary ? { _summary: params.summary } : null),
    status: params.status,
    error_message: params.errorMessage ?? null,
  })
}

export async function withActivityLog<T>(
  identity: AgentIdentity,
  action: string,
  targetType: string,
  targetId: string | undefined,
  fn: () => Promise<{ result: T; before?: unknown; after?: unknown; storeId?: string; summary?: string }>,
  storeId?: string | null,
): Promise<T> {
  try {
    const { result, before, after, storeId: resolvedStoreId, summary } = await fn()
    await logActivity({
      identity,
      action,
      targetType,
      targetId,
      storeId: resolvedStoreId ?? storeId,
      before,
      after,
      summary,
      status: 'ok',
    })
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await logActivity({
      identity,
      action,
      targetType,
      targetId,
      storeId,
      status: 'error',
      errorMessage: message,
    })
    throw err
  }
}
