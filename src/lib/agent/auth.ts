import 'server-only'

import { createHash, randomBytes } from 'crypto'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

export type AgentScope =
  | 'products:read'
  | 'products:write'
  | 'files:write'
  | 'affiliates:write'
  | 'sales:read'
  | 'shops:read'
  | 'shops:write'
  | 'analytics:read'

/** Recommended Claude E-Com V1 scopes */
export const CLAUDE_ECOM_SCOPES: AgentScope[] = [
  'shops:read',
  'shops:write',
  'products:read',
  'products:write',
  'files:write',
  'affiliates:write',
  'analytics:read',
]

export const ALL_AGENT_SCOPES: AgentScope[] = [
  'shops:read',
  'shops:write',
  'products:read',
  'products:write',
  'files:write',
  'affiliates:write',
  'analytics:read',
  'sales:read',
]

export type AgentProvider = 'claude' | 'higgsfield' | 'chatgpt' | 'custom'

export type AgentAccessMode = 'single_shop' | 'all_managed_shops'

export type AgentConnectionRow = Database['public']['Tables']['agent_connections']['Row']

export interface AgentIdentity {
  connectionId: string
  userId: string
  storeId: string | null
  accessMode: AgentAccessMode
  provider: AgentProvider
  scopes: AgentScope[]
}

const TOKEN_PREFIX = 'sk_agent_live_'

const LEGACY_SCOPE_ALIASES: Partial<Record<AgentScope, AgentScope[]>> = {
  'shops:read': ['products:read'],
  'shops:write': ['products:write'],
  'analytics:read': ['sales:read'],
  'products:read': ['shops:read'],
  'products:write': ['shops:write'],
}

/** Hash a raw bearer token for storage/lookup. Never store the raw token. */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/** Generate a new agent API token. Returns the raw token (shown once) plus its hash/prefix to persist. */
export function generateAgentToken(): { token: string; hash: string; prefix: string } {
  const random = randomBytes(24).toString('base64url')
  const token = `${TOKEN_PREFIX}${random}`
  return {
    token,
    hash: hashToken(token),
    prefix: `${token.slice(0, 18)}…`,
  }
}

/**
 * Resolve a bearer token to an authenticated agent identity.
 * Returns null if the token is missing, malformed, unknown, or revoked.
 */
export async function resolveAgentToken(authHeader: string | null): Promise<AgentIdentity | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawToken = authHeader.slice('Bearer '.length).trim()
  if (!rawToken.startsWith(TOKEN_PREFIX)) return null

  const hash = hashToken(rawToken)
  const admin = getSupabaseAdminClient()

  const { data: connection } = await admin
    .from('agent_connections')
    .select('*')
    .eq('token_hash', hash)
    .maybeSingle()

  if (!connection) return null
  if (connection.revoked_at) return null

  void admin
    .from('agent_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', connection.id)
    .then(() => {})

  const accessMode = (connection.access_mode as AgentAccessMode | null)
    ?? (connection.store_id ? 'single_shop' : 'all_managed_shops')

  return {
    connectionId: connection.id,
    userId: connection.user_id,
    storeId: connection.store_id,
    accessMode,
    provider: connection.provider as AgentProvider,
    scopes: (connection.scopes ?? []) as AgentScope[],
  }
}

/** True if the identity's granted scopes include the required scope (with legacy aliases). */
export function hasScope(identity: AgentIdentity, scope: AgentScope): boolean {
  if (identity.scopes.includes(scope)) return true
  const aliases = LEGACY_SCOPE_ALIASES[scope] ?? []
  return aliases.some(a => identity.scopes.includes(a))
}

export class AgentAuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

/** Throws AgentAuthError if the identity lacks the required scope. */
export function requireScope(identity: AgentIdentity, scope: AgentScope): void {
  if (!hasScope(identity, scope)) {
    throw new AgentAuthError(`This connection does not have the "${scope}" scope.`, 403)
  }
}
