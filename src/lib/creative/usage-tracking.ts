import 'server-only'

import type { AgentIdentity } from '@/lib/agent/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { CreativeErrorCode } from './types'

const MAX_GENERATIONS_PER_HOUR = 40

type UsageRow = {
  user_id: string
  connection_id: string
  store_id: string | null
  product_id: string | null
  generation_type: string
  provider: string | null
  model: string | null
  status: 'ok' | 'error'
  error_code: CreativeErrorCode | null
  metadata: Record<string, unknown> | null
}

function usageTable() {
  const admin = getSupabaseAdminClient()
  return admin.from('creative_generation_usage' as 'agent_activity_log')
}

export async function enforceGenerationRateLimit(identity: AgentIdentity, generationType: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error } = await usageTable()
    .select('*', { count: 'exact', head: true })
    .eq('user_id', identity.userId)
    .gte('created_at', since)

  if (error) {
    if (error.message.includes('creative_generation_usage') || error.code === 'PGRST205' || error.code === '42P01') {
      return
    }
    console.error('[creative] rate limit check failed:', error.message)
    return
  }

  if ((count ?? 0) >= MAX_GENERATIONS_PER_HOUR) {
    const { CreativeError } = await import('./errors')
    throw new CreativeError('rate_limited', `Generation limit reached (${MAX_GENERATIONS_PER_HOUR}/hour). Try again later.`, 429)
  }

  void generationType
}

export async function trackCreativeUsage(params: {
  identity: AgentIdentity
  storeId?: string | null
  productId?: string | null
  generationType: string
  provider?: string | null
  model?: string | null
  status: 'ok' | 'error'
  errorCode?: CreativeErrorCode | null
  metadata?: Record<string, unknown>
}) {
  const row: UsageRow = {
    user_id: params.identity.userId,
    connection_id: params.identity.connectionId,
    store_id: params.storeId ?? null,
    product_id: params.productId ?? null,
    generation_type: params.generationType,
    provider: params.provider ?? null,
    model: params.model ?? null,
    status: params.status,
    error_code: params.errorCode ?? null,
    metadata: params.metadata ?? null,
  }

  const { error } = await usageTable().insert(row as never)

  if (error && !error.message.includes('creative_generation_usage')) {
    console.error('[creative] usage tracking failed:', error.message)
  }
}
