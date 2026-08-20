import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { getShop, getShopSnapshot, auditShop } from '@/lib/agent/shop-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response
  const { id } = await params
  const url = new URL(request.url)
  const view = url.searchParams.get('view')
  if (view === 'snapshot') return runAgentAction(() => getShopSnapshot(auth.identity, id))
  if (view === 'audit') return runAgentAction(() => auditShop(auth.identity, id))
  return runAgentAction(() => getShop(auth.identity, id))
}
