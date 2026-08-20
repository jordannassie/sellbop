import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { requireActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'
import { generateAgentToken, ALL_AGENT_SCOPES, CLAUDE_ECOM_SCOPES, type AgentProvider, type AgentScope, type AgentAccessMode } from '@/lib/agent/auth'
import { revokeActiveClaudeConnections } from '@/lib/agent/revoke-claude-connections'

// GET /api/agent-connections — list the current user's AI agent connections (no token hashes returned)
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { data: connections, error } = await admin
    .from('agent_connections')
    .select('id, provider, name, token_prefix, scopes, access_mode, store_id, created_at, last_used_at, revoked_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ connections: connections ?? [] })
}

// POST /api/agent-connections — create a new connection. Returns the raw token ONCE.
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json()
  const { name, provider, scopes, access_mode, claude_ecom } = body as {
    name?: string
    provider?: AgentProvider
    scopes?: AgentScope[]
    access_mode?: AgentAccessMode
    claude_ecom?: boolean
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'A connection name is required.' }, { status: 400 })
  }

  const requestedScopes = (claude_ecom ? CLAUDE_ECOM_SCOPES : (scopes ?? [])).filter(
    (s): s is AgentScope => ALL_AGENT_SCOPES.includes(s),
  )
  if (requestedScopes.length === 0) {
    return NextResponse.json({ error: 'Select at least one permission.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  const resolvedProvider = provider ?? (claude_ecom ? 'claude' : 'custom')
  if (resolvedProvider === 'claude') {
    await revokeActiveClaudeConnections(user.id)
  }

  let storeId: string | null = null
  const mode: AgentAccessMode = access_mode ?? 'single_shop'

  if (mode === 'single_shop') {
    try {
      const store = await requireActiveStoreForUser(user.id)
      storeId = store.id
    } catch (err) {
      if (!(err instanceof ActiveStoreError)) throw err
    }
  }

  const { token, hash, prefix } = generateAgentToken()

  const { data: connection, error } = await admin
    .from('agent_connections')
    .insert({
      user_id: user.id,
      store_id: mode === 'single_shop' ? storeId : null,
      access_mode: mode,
      provider: resolvedProvider,
      name: name.trim(),
      token_hash: hash,
      token_prefix: prefix,
      scopes: requestedScopes,
    })
    .select('id, provider, name, token_prefix, scopes, access_mode, store_id, created_at, last_used_at, revoked_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The raw token is only ever returned here — it cannot be retrieved again.
  return NextResponse.json({ connection, token }, { status: 201 })
}
