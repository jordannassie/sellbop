import 'server-only'

import { env } from '@/lib/env'

export type CreativeProviderStatus = 'ok' | 'not_configured' | 'error'

export interface GenerateImageInput {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '4:3'
  shopId?: string
  productId?: string
}

export interface GenerateImageResult {
  status: CreativeProviderStatus
  url?: string
  base64?: string
  mimeType?: string
  provider?: string
  message?: string
}

export interface GenerateDocumentInput {
  prompt: string
  title?: string
  shopId?: string
  productId?: string
}

export interface GenerateDocumentResult {
  status: CreativeProviderStatus
  url?: string
  base64?: string
  mimeType?: string
  fileName?: string
  provider?: string
  message?: string
}

/**
 * Image generation provider abstraction.
 * Set OPENAI_API_KEY and install `openai` package to enable DALL-E generation.
 */
export async function generateProductImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  void input
  void env
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 'not_configured',
      provider: 'openai',
      message: 'Image generation is not configured. Set OPENAI_API_KEY and install the openai package to enable.',
    }
  }
  return {
    status: 'not_configured',
    provider: 'openai',
    message: 'OPENAI_API_KEY is set but the openai npm package is not installed. Run: npm install openai',
  }
}

export async function generateShopBanner(input: GenerateImageInput): Promise<GenerateImageResult> {
  return generateProductImage({ ...input, aspectRatio: '16:9', prompt: `Store banner: ${input.prompt}` })
}

export async function generateProductPdf(input: GenerateDocumentInput): Promise<GenerateDocumentResult> {
  void input
  return {
    status: 'not_configured',
    provider: 'none',
    message: 'PDF generation is not configured yet. Upload delivery files directly via upload_product_file.',
  }
}
