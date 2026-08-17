import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { getProducts, createProduct, type CreateProductInput } from '@/lib/agent/service'

// GET /api/agent/v1/products — get_products (list the connected store's products)
export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  return runAgentAction(async () => ({ products: await getProducts(auth.identity) }))
}

// POST /api/agent/v1/products — create_product
export async function POST(request: Request) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const body = (await request.json()) as CreateProductInput

  return runAgentAction(async () => ({ product: await createProduct(auth.identity, body) }))
}
