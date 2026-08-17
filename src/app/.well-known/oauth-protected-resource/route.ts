import 'server-only'
import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler'
import { getIssuer } from '@/lib/oauth/mcp-oauth'

// RFC 9728 — Protected Resource Metadata. Points MCP clients at this
// server's own OAuth authorization server (see
// /.well-known/oauth-authorization-server).
export async function GET(req: Request) {
  const issuer = getIssuer(req)
  const handler = protectedResourceHandler({ authServerUrls: [issuer] })
  return handler(req)
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
