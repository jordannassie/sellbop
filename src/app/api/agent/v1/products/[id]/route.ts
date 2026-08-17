import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { getProduct, updateProduct, type ProductPatch } from '@/lib/agent/service'

// GET /api/agent/v1/products/[id] — get_product
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  return runAgentAction(() => getProduct(auth.identity, id))
}

// PATCH /api/agent/v1/products/[id] — generic update.
// Backs update_product, set_product_description, set_product_price,
// set_primary_product_image, enable_affiliates, disable_affiliates,
// set_affiliate_commission, save_product_as_draft (is_live:false),
// and publish_product (is_live:true) — all are just field-scoped
// PATCH calls against this one endpoint.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  const body = (await request.json()) as ProductPatch

  return runAgentAction(async () => ({ product: await updateProduct(auth.identity, id, body) }))
}
