export type ResourceBlock =
  | { type: 'hero'; title?: string; subtitle?: string }
  | { type: 'text'; title?: string; body?: string }
  | { type: 'feature_list'; title?: string; items: string[] }
  | { type: 'prompt_box'; title?: string; prompt: string }
  | { type: 'steps'; title?: string; items: string[] }
  | { type: 'workflow'; title?: string; steps: { title: string; description?: string; example?: string; bullets?: string[] }[] }
  | { type: 'commission_example'; price: string; percent: string; earns: string; note?: string }
  | { type: 'channels'; title?: string; items: { title: string; body: string }[] }
  | { type: 'product_categories'; title?: string; categories: { title: string; description: string; icon?: string }[] }
  | { type: 'prompts_list'; title?: string; prompts: string[]; cta_text?: string; cta_url?: string }
  | { type: 'integration'; key: string }
  | { type: 'cta'; text: string; url: string; variant?: 'primary' | 'secondary' }

export interface ResourcePageRow {
  id: string
  slug: string
  title: string
  subtitle: string | null
  category: string | null
  icon: string | null
  image_url: string | null
  content_json: { blocks: ResourceBlock[] }
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface ResourceCardRow {
  id: string
  page_slug: string
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  sort_order: number
  is_published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface IntegrationMeta {
  name: string
  badge: string
  headline: string
  description: string
  image_url: string
  features: string[]
  prompt?: string
  steps_title?: string
  steps?: string[]
  cta_text: string
  cta_url: string
  external_url?: string
  powered_by?: string
  flow?: string
}
