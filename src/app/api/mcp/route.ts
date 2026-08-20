import 'server-only'

import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import type { AuthInfo } from '@modelcontextprotocol/server'
import { resolveAgentToken, type AgentIdentity } from '@/lib/agent/auth'
import { registerSellBopMcpTools } from '@/lib/agent/register-mcp-tools'

const handler = createMcpHandler((server) => {
  registerSellBopMcpTools(server)
})

const verifyToken = async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined

  const identity = await resolveAgentToken(`Bearer ${bearerToken}`)
  if (!identity) return undefined

  return {
    token: bearerToken,
    scopes: identity.scopes,
    clientId: identity.userId,
    extra: { identity },
  }
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
})

export { authHandler as GET, authHandler as POST }

export const maxDuration = 60
