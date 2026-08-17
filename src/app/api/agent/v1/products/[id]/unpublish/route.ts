import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { unpublishProduct } from '@/lib/agent/service'

// POST /api/agent/v1/products/[id]/unpublish — unpublish_product / save_product_as_draft
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  return runAgentAction(async () => ({ product: await unpublishProduct(auth.identity, id) }))
}
