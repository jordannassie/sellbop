import 'server-only'
import { metadataCorsOptionsRequestHandler } from 'mcp-handler'
import { getIssuer } from '@/lib/oauth/mcp-oauth'

// RFC 8414 — OAuth 2.0 Authorization Server Metadata.
// Tells MCP clients (Claude, etc.) where to register, authorize, and
// exchange tokens against this server.
export async function GET(req: Request) {
  const issuer = getIssuer(req)
  return Response.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['products:read', 'products:write', 'files:write', 'affiliates:write'],
  })
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
