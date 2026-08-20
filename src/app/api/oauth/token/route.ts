import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPkceS256 } from '@/lib/oauth/mcp-oauth'
import { generateAgentToken, ALL_AGENT_SCOPES, CLAUDE_ECOM_SCOPES, type AgentScope } from '@/lib/agent/auth'
import { accessFromAuthCode, resolvePendingAgentAccess } from '@/lib/agent/oauth-access-mode'
import { revokeActiveClaudeConnections } from '@/lib/agent/revoke-claude-connections'

// RFC 6749 §4.1.3 (authorization_code grant) + RFC 7636 (PKCE).
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
    return Response.json({
      error: 'invalid_request',
      error_description: `Missing required param(s). Received keys: ${Object.keys(params).join(', ') || '(none)'}; content-type: ${contentType}`,
    }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  const { data: authCode } = await admin
    .from('oauth_authorization_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!authCode) {
    return Response.json({ error: 'invalid_grant', error_description: 'Unknown or already-consumed code.' }, { status: 400 })
  }
  if (authCode.used) {
    return Response.json({ error: 'invalid_grant', error_description: 'Code already used.' }, { status: 400 })
  }
  if (authCode.client_id !== client_id) {
    return Response.json({ error: 'invalid_grant', error_description: `client_id mismatch (expected ${authCode.client_id}).` }, { status: 400 })
  }
  if (authCode.redirect_uri !== redirect_uri) {
    return Response.json({ error: 'invalid_grant', error_description: `redirect_uri mismatch (expected ${authCode.redirect_uri}, got ${redirect_uri}).` }, { status: 400 })
  }
  if (new Date(authCode.expires_at).getTime() < Date.now()) {
    return Response.json({ error: 'invalid_grant', error_description: 'Code expired.' }, { status: 400 })
  }
  if (!verifyPkceS256(code_verifier, authCode.code_challenge)) {
    return Response.json({
      error: 'invalid_grant',
      error_description: `PKCE verification failed. verifier_len=${code_verifier.length} challenge=${authCode.code_challenge}`,
    }, { status: 400 })
  }

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
  const grantedScopes = scopes.length > 0 ? scopes : CLAUDE_ECOM_SCOPES

  const fallbackAccess = await resolvePendingAgentAccess(authCode.user_id)
  const { accessMode, storeId } = accessFromAuthCode(authCode, fallbackAccess)

  // Replace any prior active Claude connection so reconnecting changes effective access.
  await revokeActiveClaudeConnections(authCode.user_id)

  const { token, hash, prefix } = generateAgentToken()

  const { error: insertError } = await admin.from('agent_connections').insert({
    user_id: authCode.user_id,
    store_id: storeId,
    access_mode: accessMode,
    provider: 'claude',
    name: `Claude E-Com — ${new Date().toLocaleDateString()}`,
    token_hash: hash,
    token_prefix: prefix,
    scopes: grantedScopes,
  })

  if (insertError) {
    return Response.json({ error: 'server_error', error_description: insertError.message }, { status: 500 })
  }

  return Response.json({
    access_token: token,
    token_type: 'bearer',
    scope: grantedScopes.join(' '),
  })
}
