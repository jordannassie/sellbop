import type { AgentScope } from './auth'
import { ALL_AGENT_SCOPES } from './auth'
import type { AgentAccessMode } from './auth'

export const OAUTH_ACCESS_SCOPE_PREFIX = 'sellbop:access:'

export type ScopedAgentAccess = {
  accessMode: AgentAccessMode
  storeId: string | null
}

/** Encode dashboard access choice into the OAuth scope string (survives legacy DB schemas). */
export function encodeAccessModeScope(access: ScopedAgentAccess): string {
  if (access.accessMode === 'all_managed_shops') {
    return `${OAUTH_ACCESS_SCOPE_PREFIX}all_managed_shops`
  }
  return `${OAUTH_ACCESS_SCOPE_PREFIX}single_shop:${access.storeId ?? 'none'}`
}

/** Read access mode pinned on an OAuth authorization code scope string. */
export function parseAccessFromScope(scope: string | null | undefined): ScopedAgentAccess | null {
  if (!scope) return null

  for (const part of scope.split(/\s+/)) {
    if (part === `${OAUTH_ACCESS_SCOPE_PREFIX}all_managed_shops`) {
      return { accessMode: 'all_managed_shops', storeId: null }
    }

    const singlePrefix = `${OAUTH_ACCESS_SCOPE_PREFIX}single_shop:`
    if (part.startsWith(singlePrefix)) {
      const rawStoreId = part.slice(singlePrefix.length)
      return {
        accessMode: 'single_shop',
        storeId: rawStoreId === 'none' ? null : rawStoreId,
      }
    }
  }

  return null
}

/** Strip SellBop-internal scope tags and return granted agent scopes only. */
export function filterAgentScopes(scope: string | null | undefined): AgentScope[] {
  return (scope?.split(/\s+/) ?? []).filter((part): part is AgentScope =>
    !part.startsWith(OAUTH_ACCESS_SCOPE_PREFIX) && ALL_AGENT_SCOPES.includes(part as AgentScope),
  )
}

/** Append (or replace) the access-mode scope tag on a scope string. */
export function withAccessModeScope(scope: string, access: ScopedAgentAccess): string {
  const agentScopes = filterAgentScopes(scope)
  return [...agentScopes, encodeAccessModeScope(access)].join(' ')
}
