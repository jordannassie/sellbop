import 'server-only'

import { getOpenAiImageProvider } from './providers/openai-image'
import { isPdfGenerationAvailable } from './pdf-renderer'
import type { CreativeCapabilities } from './types'

export function getCreativeCapabilities(): CreativeCapabilities {
  const openai = getOpenAiImageProvider()
  const imageAvailable = openai.isConfigured() ? 'available' : 'unavailable'

  return {
    image_generation: imageAvailable,
    banner_generation: imageAvailable,
    pdf_generation: isPdfGenerationAvailable() ? 'available' : 'unavailable',
    provider: openai.isConfigured() ? openai.name : null,
    supported_aspect_ratios: ['1:1', '16:9', '4:3'],
    supported_image_types: ['product_cover', 'lifestyle', 'mockup', 'supporting_image', 'shop_banner'],
  }
}
