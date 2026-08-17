import { authenticateAgentRequest, runAgentAction } from '@/lib/agent/route-helpers'
import { uploadProductFile, attachProductFile, AgentServiceError } from '@/lib/agent/service'

interface UploadBody {
  file_name?: string
  mime_type?: string
  base64_data?: string
  // Alternative: register a file already uploaded elsewhere.
  storage_path?: string
  file_size?: number
}

// POST /api/agent/v1/products/[id]/files
// — upload_product_file: send { file_name, mime_type, base64_data } to upload bytes directly.
// — attach_product_file: send { file_name, mime_type, storage_path } to register an existing upload.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentRequest(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  const body = (await request.json()) as UploadBody

  if (!body.file_name || !body.mime_type) {
    return runAgentAction(async () => {
      throw new AgentServiceError('file_name and mime_type are required.', 400)
    })
  }

  return runAgentAction(async () => {
    if (body.storage_path) {
      const file = await attachProductFile(auth.identity, id, {
        fileName: body.file_name!,
        fileType: body.mime_type!,
        fileSize: body.file_size,
        storagePath: body.storage_path!,
      })
      return { file }
    }

    if (!body.base64_data) {
      throw new AgentServiceError('Provide either base64_data (to upload) or storage_path (to attach).', 400)
    }

    const file = await uploadProductFile(auth.identity, id, {
      fileName: body.file_name!,
      mimeType: body.mime_type!,
      base64Data: body.base64_data,
    })
    return { file }
  })
}
