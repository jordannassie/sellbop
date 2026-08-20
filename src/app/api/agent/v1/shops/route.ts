import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { listShops } from '@/lib/agent/shop-service'

export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response
  return runAgentAction(() => listShops(auth.identity))
}
