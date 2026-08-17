import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { generateAuthCode, AUTH_CODE_TTL_MS } from '@/lib/oauth/mcp-oauth'
import { ALL_AGENT_SCOPES, type AgentScope } from '@/lib/agent/auth'

// Called by the /oauth/authorize consent page after the user clicks Allow.
// Requires an authenticated SellBop session (cookie-based, same as every
// other dashboard API route) — this is the actual login step in the OAuth
// flow. Creates a single-use authorization code and returns the redirect
// URL for the client page to navigate to.
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return Response.json({ error: 'server_error', error_description: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return Response.json({ error: 'access_denied', error_description: 'Not signed in.' }, { status: 401 })
  }

  const body = await request.json()
  const { client_id, redirect_uri, code_challenge, code_challenge_method, state, scope } = body as {
    client_id?: string
    redirect_uri?: string
    code_challenge?: string
    code_challenge_method?: string
    state?: string
    scope?: string
  }

  if (!client_id || !redirect_uri || !code_challenge) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (code_challenge_method && code_challenge_method !== 'S256') {
    return Response.json({ error: 'invalid_request', error_description: 'Only S256 PKCE is supported.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  const { data: client } = await admin
    .from('oauth_clients')
    .select('client_id, redirect_uris')
    .eq('client_id', client_id)
    .maybeSingle()

  if (!client) {
    return Response.json({ error: 'invalid_client' }, { status: 400 })
  }
  if (!client.redirect_uris.includes(redirect_uri)) {
    return Response.json({ error: 'invalid_request', error_description: 'redirect_uri does not match registered client.' }, { status: 400 })
  }

  const requestedScopes = (scope?.split(' ') ?? []).filter((s): s is AgentScope =>
    ALL_AGENT_SCOPES.includes(s as AgentScope),
  )
  const grantedScopes = requestedScopes.length > 0 ? requestedScopes : ALL_AGENT_SCOPES

  const code = generateAuthCode()
  const { error } = await admin.from('oauth_authorization_codes').insert({
    code,
    client_id,
    user_id: user.id,
    redirect_uri,
    code_challenge,
    code_challenge_method: code_challenge_method ?? 'S256',
    scope: grantedScopes.join(' '),
    expires_at: new Date(Date.now() + AUTH_CODE_TTL_MS).toISOString(),
  })

  if (error) {
    return Response.json({ error: 'server_error', error_description: error.message }, { status: 500 })
  }

  const redirectUrl = new URL(redirect_uri)
  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)

  return Response.json({ redirect_url: redirectUrl.toString() })
}
