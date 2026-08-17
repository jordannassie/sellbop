import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPkceS256 } from '@/lib/oauth/mcp-oauth'
import { generateAgentToken, ALL_AGENT_SCOPES, type AgentScope } from '@/lib/agent/auth'

// RFC 6749 §4.1.3 (authorization_code grant) + RFC 7636 (PKCE).
// Exchanges a single-use authorization code for an access token. The
// access token issued here is a normal sk_agent_live_... token — it's
// created in agent_connections exactly like the manual "Connect a tool"
// flow, so it works with resolveAgentToken() and every existing scope
// check unmodified. Long-lived (matches the existing manual-token model;
// no refresh tokens for now — revoke from Settings → AI & Integrations).
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return Response.json({ error: 'server_error', error_description: 'Database not configured.' }, { status: 503 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  let params: Record<string, string> = {}
  if (contentType.includes('application/json')) {
    params = await request.json()
  } else {
    const form = await request.formData()
    for (const [k, v] of form.entries()) params[k] = String(v)
  }

  const { grant_type, code, redirect_uri, code_verifier, client_id } = params

  if (grant_type !== 'authorization_code') {
    return Response.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }
  if (!code || !redirect_uri || !code_verifier || !client_id) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  const { data: authCode } = await admin
    .from('oauth_authorization_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!authCode || authCode.used || authCode.client_id !== client_id || authCode.redirect_uri !== redirect_uri) {
    return Response.json({ error: 'invalid_grant' }, { status: 400 })
  }
  if (new Date(authCode.expires_at).getTime() < Date.now()) {
    return Response.json({ error: 'invalid_grant', error_description: 'Code expired.' }, { status: 400 })
  }
  if (!verifyPkceS256(code_verifier, authCode.code_challenge)) {
    return Response.json({ error: 'invalid_grant', error_description: 'PKCE verification failed.' }, { status: 400 })
  }

  // Single-use — mark consumed before minting the token.
  const { error: markUsedError } = await admin
    .from('oauth_authorization_codes')
    .update({ used: true })
    .eq('code', code)
    .eq('used', false)
  if (markUsedError) {
    return Response.json({ error: 'server_error' }, { status: 500 })
  }

  const scopes = (authCode.scope?.split(' ') ?? []).filter((s): s is AgentScope =>
    ALL_AGENT_SCOPES.includes(s as AgentScope),
  )

  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', authCode.user_id)
    .maybeSingle()

  const { token, hash, prefix } = generateAgentToken()

  const { error: insertError } = await admin.from('agent_connections').insert({
    user_id: authCode.user_id,
    store_id: store?.id ?? null,
    provider: 'claude',
    name: `Claude (OAuth) — ${new Date().toLocaleDateString()}`,
    token_hash: hash,
    token_prefix: prefix,
    scopes: scopes.length > 0 ? scopes : ALL_AGENT_SCOPES,
  })

  if (insertError) {
    return Response.json({ error: 'server_error', error_description: insertError.message }, { status: 500 })
  }

  return Response.json({
    access_token: token,
    token_type: 'bearer',
    scope: (scopes.length > 0 ? scopes : ALL_AGENT_SCOPES).join(' '),
  })
}
