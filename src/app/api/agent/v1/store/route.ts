import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { getStore } from '@/lib/agent/service'

// GET /api/agent/v1/store — get_store
export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  return runAgentAction(() => getStore(auth.identity))
}
