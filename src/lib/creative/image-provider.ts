import type { AspectRatio, GeneratedImagePayload, ImagePurpose } from './types'

export interface ImageGenerationRequest {
  prompt: string
  purpose: ImagePurpose
  aspectRatio?: AspectRatio
  brandContext?: import('./types').BrandContext
}

export interface ImageProvider {
  readonly name: string
  isConfigured(): boolean
  generateImage(request: ImageGenerationRequest): Promise<GeneratedImagePayload>
}

export function aspectRatioToOpenAiSize(aspectRatio: AspectRatio | undefined, purpose: ImagePurpose): '1024x1024' | '1792x1024' | '1024x1792' {
  if (purpose === 'shop_banner' || aspectRatio === '16:9') return '1792x1024'
  if (aspectRatio === '4:3') return '1024x1792'
  return '1024x1024'
}
