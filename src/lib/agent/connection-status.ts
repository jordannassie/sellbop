export type ClaudeConnectionState = 'not_connected' | 'mcp_ready' | 'connected'

export interface AgentConnectionSummary {
  provider: string
  revoked_at: string | null
  last_used_at: string | null
}

/** Derive Claude connection state from stored agent connections. */
export function getClaudeConnectionState(connections: AgentConnectionSummary[]): ClaudeConnectionState {
  const active = connections.filter(c => c.provider === 'claude' && !c.revoked_at)
  if (active.length === 0) return 'not_connected'
  if (active.some(c => c.last_used_at)) return 'connected'
  return 'mcp_ready'
}

export const CLAUDE_TEST_PROMPT = 'Show me my SellBop products.'
