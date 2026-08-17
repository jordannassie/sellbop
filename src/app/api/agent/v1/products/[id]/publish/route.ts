import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { publishProduct } from '@/lib/agent/service'

// POST /api/agent/v1/products/[id]/publish — publish_product
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  return runAgentAction(async () => ({ product: await publishProduct(auth.identity, id) }))
}
