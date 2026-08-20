import 'server-only'

import OpenAI from 'openai'
import type { ImageProvider, ImageGenerationRequest } from '../image-provider'
import { aspectRatioToOpenAiSize } from '../image-provider'
import { CreativeError } from '../errors'

export class OpenAiImageProvider implements ImageProvider {
  readonly name = 'openai'

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY?.trim()
  }

  async generateImage(request: ImageGenerationRequest) {
    if (!this.isConfigured()) {
      throw new CreativeError('provider_not_configured', 'OpenAI image generation is not configured. Set OPENAI_API_KEY.', 503)
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const size = aspectRatioToOpenAiSize(request.aspectRatio, request.purpose)

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: request.prompt.slice(0, 4000),
        n: 1,
        size,
        response_format: 'b64_json',
        quality: 'standard',
      })

      const item = response.data?.[0]
      if (!item?.b64_json) {
        throw new CreativeError('generation_failed', 'Image provider returned no image data.', 502)
      }

      return {
        buffer: Buffer.from(item.b64_json, 'base64'),
        mimeType: 'image/png',
        provider: this.name,
        model: 'dall-e-3',
        revisedPrompt: item.revised_prompt ?? undefined,
        metadata: {
          size,
          purpose: request.purpose,
        },
      }
    } catch (err) {
      if (err instanceof CreativeError) throw err
      const message = err instanceof Error ? err.message : 'OpenAI image generation failed.'
      if (message.includes('429')) {
        throw new CreativeError('rate_limited', 'Image provider rate limit reached.', 429)
      }
      throw new CreativeError('generation_failed', 'Image generation failed.', 502)
    }
  }
}

let provider: OpenAiImageProvider | null = null

export function getOpenAiImageProvider(): OpenAiImageProvider {
  if (!provider) provider = new OpenAiImageProvider()
  return provider
}
