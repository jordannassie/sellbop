export type { BrandContext, CreativeCapabilities, CreativeToolResult, ImagePurpose, AspectRatio, PdfContentInput, PdfSection } from './types'
export { CreativeError } from './errors'
export { getCreativeCapabilities } from './capabilities'
export {
  generateProductImageForAgent,
  generateShopBannerForAgent,
  generateProductPdfForAgent,
  buildProductAssetsForAgent,
} from './creative-service'

/** @deprecated Use generateProductImageForAgent with AgentIdentity via MCP */
export async function generateProductImage() {
  return {
    success: false,
    error_code: 'invalid_input' as const,
    message: 'Use MCP generate_product_image with shop_id and product_id. Direct stub removed in Creative Factory V1.1.',
    generation_status: 'failed' as const,
  }
}

/** @deprecated */
export const generateShopBanner = generateProductImage

/** @deprecated */
export const generateProductPdf = generateProductImage
