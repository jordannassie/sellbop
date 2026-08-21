import { z } from 'zod'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'
import type { GoogleTrendItem } from './google-trends-parser'

export type { GoogleTrendItem } from './google-trends-parser'

export const PRODUCT_IDEA_TYPES = [
  'Guide',
  'Workbook',
  'Template',
  'Toolkit',
  'Course',
  'Checklist',
  'Spreadsheet',
  'Notion Template',
  'Bundle',
  'Other',
] as const

export const TREND_VALUES = ['rising', 'stable', 'falling', 'unknown'] as const
export type Trend = (typeof TREND_VALUES)[number]

export type ProductIdeaSource =
  | 'google_trends'
  | 'google_trends_youtube'
  | 'youtube'
  | 'ai_estimate'

export interface TrendResearch {
  query: string
  trafficLabel: string | null
  trafficApprox: number | null
  publishedAt: string | null
  sourceUrl: string
  exploreUrl: string
  relatedTitles: string[]
}

export type ProductFitLevel = 'very_strong' | 'strong' | 'moderate' | 'weak' | 'unknown'

export interface ProductIdeaResearch {
  trendResearch?: TrendResearch
  productFitScore?: number | null
  evergreenScore?: number | null
  productFitReason?: string | null
  whyProductAngle?: string | null
}

export interface ProductIdea {
  id: string
  title: string
  hook: string
  description: string
  targetAudience: string
  category: string
  productType: (typeof PRODUCT_IDEA_TYPES)[number]
  suggestedPriceMinCents: number
  suggestedPriceMaxCents: number
  primaryKeyword: string | null
  supportingKeywords: string[]
  /** @deprecated migration 036 compat — always null in Google Trends V1 */
  estimatedMonthlySearches: number | null
  cpc: number | null
  searchCompetition: number | null
  trend: Trend
  trendPercent: number | null
  /** Validated score when source is google_trends* */
  opportunityScore: number | null
  /** Qualitative AI-only estimate label strength 0-100 */
  aiOpportunityEstimate: number | null
  source: ProductIdeaSource
  whyItCouldSell: string
  productContents: string[]
  research?: ProductIdeaResearch
}

export const generateRequestSchema = z.object({
  topic: z.string().max(500).optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  count: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(5),
  country: z.string().max(80).optional(),
})

export type GenerateProductIdeasInput = z.infer<typeof generateRequestSchema>

export const aiTrendIdeaSchema = z.object({
  title: z.string().min(3),
  hook: z.string().min(3),
  description: z.string().min(10),
  targetAudience: z.string().min(3),
  category: z.string().min(1),
  productType: z.enum(PRODUCT_IDEA_TYPES),
  suggestedPriceMinCents: z.number().int().min(0),
  suggestedPriceMaxCents: z.number().int().min(0),
  source: z.enum(['google_trends', 'ai_estimate']),
  sourceTrendQuery: z.string().nullable().optional(),
  productFitScore: z.number().min(0).max(100),
  evergreenScore: z.number().min(0).max(100),
  whyItCouldSell: z.string().min(10),
  productContents: z.array(z.string()).min(1),
  primaryKeyword: z.string().nullable().optional(),
  supportingKeywords: z.array(z.string()).default([]),
})

export const aiTrendIdeasResponseSchema = z.object({
  ideas: z.array(aiTrendIdeaSchema).min(1),
})

export const saveProductIdeaSchema = z.object({
  storeId: z.string().uuid().nullable().optional(),
  idea: z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    hook: z.string().optional(),
    description: z.string().optional(),
    targetAudience: z.string().optional(),
    category: z.string().optional(),
    productType: z.string().optional(),
    suggestedPriceMinCents: z.number().int().nullable().optional(),
    suggestedPriceMaxCents: z.number().int().nullable().optional(),
    primaryKeyword: z.string().nullable().optional(),
    supportingKeywords: z.array(z.string()).optional(),
    estimatedMonthlySearches: z.number().int().nullable().optional(),
    cpc: z.number().nullable().optional(),
    searchCompetition: z.number().nullable().optional(),
    trend: z.enum(TREND_VALUES).optional(),
    trendPercent: z.number().nullable().optional(),
    opportunityScore: z.number().int().nullable().optional(),
    aiOpportunityEstimate: z.number().int().nullable().optional(),
    source: z.enum(['google_trends', 'google_trends_youtube', 'youtube', 'ai_estimate', 'youtube_data', 'search_data']).optional(),
    whyItCouldSell: z.string().optional(),
    productContents: z.array(z.string()).optional(),
    research: z.unknown().optional(),
    sourceData: z.unknown().optional(),
  }),
})

export interface GenerateProductIdeasSuccess {
  ok: true
  ideas: ProductIdea[]
  message: string | null
  trendingNow: GoogleTrendItem[]
  requestId: string
}

export interface GenerateProductIdeasErrorBody {
  ok: false
  error: {
    code: string
    message: string
  }
  requestId: string
}

export type GenerateProductIdeasResult = GenerateProductIdeasSuccess

export function productFitLabel(score: number): string {
  if (score >= 85) return 'Very Strong'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Moderate'
  return 'Weak'
}

export { aiEstimateLabel } from './google-trends-parser'
