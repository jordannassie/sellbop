import 'server-only'

import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { resolveAgentToken, AgentAuthError, type AgentIdentity } from './auth'
import { AgentServiceError } from './service'
import { AgentShopAccessError } from './shop-access'

/**
 * Authenticates an incoming /api/agent/v1/* request via its Authorization
 * bearer token. Returns either an AgentIdentity or a ready-to-return
 * NextResponse describing the auth failure.
 */
export async function authenticateAgentRequest(
  request: Request,
): Promise<{ identity: AgentIdentity } | { response: NextResponse }> {
  if (!isSupabaseAdminConfigured()) {
    return { response: NextResponse.json({ error: 'Database not configured.' }, { status: 503 }) }
  }

  const identity = await resolveAgentToken(request.headers.get('authorization'))
  if (!identity) {
    return {
      response: NextResponse.json(
        { error: 'Invalid or missing API token. Use "Authorization: Bearer sk_agent_live_…".' },
        { status: 401 },
      ),
    }
  }

  return { identity }
}

/** Runs an agent action and maps thrown AgentAuthError/AgentServiceError to the right HTTP status. */
export async function runAgentAction<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn()
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AgentAuthError || err instanceof AgentServiceError || err instanceof AgentShopAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const message = err instanceof Error ? err.message : 'Unknown error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
