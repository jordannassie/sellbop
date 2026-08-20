export type CreativeErrorCode =
  | 'provider_not_configured'
  | 'generation_failed'
  | 'invalid_product'
  | 'unauthorized_shop'
  | 'storage_failed'
  | 'attachment_failed'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_input'

export type ImagePurpose =
  | 'product_cover'
  | 'lifestyle'
  | 'mockup'
  | 'supporting_image'
  | 'shop_banner'

export type AspectRatio = '1:1' | '16:9' | '4:3'

export interface BrandContext {
  brand_name?: string
  audience?: string
  visual_direction?: string
  tone?: string
  typography_direction?: string
  photography_style?: string
  image_mood?: string
  visual_motifs?: string[]
  exclusions?: string
}

export interface PdfSection {
  heading: string
  body?: string
  bullets?: string[]
  callout?: string
}

export interface PdfContentInput {
  title: string
  subtitle?: string
  audience?: string
  content_brief?: string
  sections?: PdfSection[]
  author_name?: string
  include_health_disclaimer?: boolean
}

export interface GeneratedImagePayload {
  buffer: Buffer
  mimeType: string
  provider: string
  model?: string
  revisedPrompt?: string
  metadata?: Record<string, unknown>
}

export interface CreativeCapabilities {
  image_generation: 'available' | 'unavailable'
  banner_generation: 'available' | 'unavailable'
  pdf_generation: 'available' | 'unavailable'
  provider: string | null
  supported_aspect_ratios: AspectRatio[]
  supported_image_types: ImagePurpose[]
}

export interface CreativeToolResult {
  success: boolean
  error_code?: CreativeErrorCode
  message?: string
  product_id?: string
  shop_id?: string
  media_id?: string
  file_id?: string
  url?: string
  filename?: string
  primary?: boolean
  provider?: string
  model?: string
  generation_status?: 'completed' | 'failed'
}
