import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { generateClientId } from '@/lib/oauth/mcp-oauth'

// RFC 7591 — OAuth 2.0 Dynamic Client Registration.
// Deliberately unauthenticated (per spec): any MCP client (Claude, etc.)
// can self-register to obtain a client_id before starting the
// authorization-code + PKCE flow. Public client — no secret is issued or
// required (token_endpoint_auth_method: "none"), since the code exchange is
// protected by PKCE, not a client secret.
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return Response.json({ error: 'server_error', error_description: 'Database not configured.' }, { status: 503 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // some clients send an empty body
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as unknown[]).filter((u): u is string => typeof u === 'string')
    : []

  if (redirectUris.length === 0) {
    return Response.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris is required.' },
      { status: 400 },
    )
  }

  const clientName = typeof body.client_name === 'string' ? body.client_name : 'MCP client'
  const clientId = generateClientId()

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('oauth_clients').insert({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
  })

  if (error) {
    return Response.json({ error: 'server_error', error_description: error.message }, { status: 500 })
  }

  return Response.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
    },
    { status: 201 },
  )
}
