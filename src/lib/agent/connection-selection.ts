/** Pick the Claude connection the UI should treat as authoritative. */
export interface ClaudeConnectionRow {
  id: string
  provider: string
  access_mode?: string | null
  store_id?: string | null
  token_prefix?: string | null
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
  name?: string
}

export function selectPrimaryClaudeConnection(
  connections: ClaudeConnectionRow[],
): ClaudeConnectionRow | null {
  const active = connections.filter(c => c.provider === 'claude' && !c.revoked_at)
  if (active.length === 0) return null
  if (active.length === 1) return active[0]

  return [...active].sort((a, b) => {
    const aUsed = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
    const bUsed = b.last_used_at ? new Date(b.last_used_at).getTime() : 0
    if (bUsed !== aUsed) return bUsed - aUsed
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]
}

export function staleClaudeConnectionIds(
  connections: ClaudeConnectionRow[],
  primary: ClaudeConnectionRow | null,
): string[] {
  if (!primary) return []
  return connections
    .filter(c => c.provider === 'claude' && !c.revoked_at && c.id !== primary.id)
    .map(c => c.id)
}
