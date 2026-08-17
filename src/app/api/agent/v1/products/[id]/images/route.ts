import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { uploadProductImage, AgentServiceError } from '@/lib/agent/service'

interface UploadImageBody {
  file_name?: string
  mime_type?: string
  base64_data?: string
  set_primary?: boolean
}

// POST /api/agent/v1/products/[id]/images — upload_product_image
// (also doubles as set_primary_product_image when set_primary is true/omitted)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  const body = (await request.json()) as UploadImageBody

  if (!body.file_name || !body.mime_type || !body.base64_data) {
    return runAgentAction(async () => {
      throw new AgentServiceError('file_name, mime_type, and base64_data are required.', 400)
    })
  }

  return runAgentAction(async () =>
    uploadProductImage(auth.identity, id, {
      fileName: body.file_name!,
      mimeType: body.mime_type!,
      base64Data: body.base64_data!,
      setPrimary: body.set_primary,
    }),
  )
}
