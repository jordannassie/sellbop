import { z } from 'zod'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'

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

/** youtube_data = validated YouTube evidence; ai_estimate = no market-data validation */
export type ProductIdeaSource = 'youtube_data' | 'ai_estimate'

export type QuerySource = 'youtube' | 'autocomplete' | 'ai'

export interface QuerySignal {
  query: string
  source: QuerySource
}

export type BreakoutLevel = 'major' | 'strong' | 'breakout' | null

export interface YouTubeVideoExample {
  title: string
  videoId: string
  channelId: string | null
  channelTitle: string
  views: number | null
  channelSubscribers: number | null
  breakoutRatio: number | null
  breakoutLevel: BreakoutLevel
  publishedAt: string
}

export interface YouTubeSignal {
  available: boolean
  youtubeDemandScore: number | null
  viewStrengthScore: number | null
  breakoutStrengthScore: number | null
  momentumScore: number | null
  crossCreatorScore: number | null
  relevantVideoCount: number
  breakoutVideoCount: number
  uniqueCreatorCount: number
  medianViews: number | null
  topVideoViews: number | null
  topBreakoutRatio: number | null
  recentMomentum: 'rising' | 'strong' | 'moderate' | 'limited' | 'unknown'
  examples: YouTubeVideoExample[]
}

export interface GoogleTrendsSignal {
  available: boolean
  matched: boolean
  searchTier: string | null
  growthPercent: number | null
  active: boolean | null
}

export type ProductFitLevel = 'very_strong' | 'strong' | 'moderate' | 'weak' | 'unknown'

export interface ProductFitSignal {
  available: boolean
  level: ProductFitLevel
  fitScore: number | null
  reason: string | null
}

export interface SellBopSignal {
  available: boolean
  demandScore: number | null
  sampleSize: number | null
  medianPriceCents: number | null
  categoryProductCount: number | null
  summary: string | null
}

export interface ProductIdeaResearch {
  theme?: string
  queries?: QuerySignal[]
  youtube?: YouTubeSignal
  trends?: GoogleTrendsSignal
  productFit?: ProductFitSignal
  sellbop?: SellBopSignal
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
  /** @deprecated V1 — always null; kept for migration 036 compat */
  estimatedMonthlySearches: number | null
  /** @deprecated V1 — always null */
  cpc: number | null
  /** @deprecated V1 — always null */
  searchCompetition: number | null
  /** @deprecated V1 — use research.youtube.recentMomentum */
  trend: Trend
  /** @deprecated V1 — always null */
  trendPercent: number | null
  opportunityScore: number | null
  source: ProductIdeaSource
  whyItCouldSell: string
  productContents: string[]
  research?: ProductIdeaResearch
}

export const generateRequestSchema = z.object({
  topic: z.string().max(500).optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  count: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(10),
  country: z.string().max(80).optional(),
})

export type GenerateProductIdeasInput = z.infer<typeof generateRequestSchema>

export const aiProductIdeaSchema = z.object({
  title: z.string().min(3),
  hook: z.string().min(3),
  description: z.string().min(10),
  targetAudience: z.string().min(3),
  category: z.string().min(1),
  productType: z.enum(PRODUCT_IDEA_TYPES),
  suggestedPriceMinCents: z.number().int().min(0),
  suggestedPriceMaxCents: z.number().int().min(0),
  primaryKeyword: z.string().nullable().optional(),
  supportingKeywords: z.array(z.string()).default([]),
  whyItCouldSell: z.string().min(10),
  productContents: z.array(z.string()).min(1),
})

export const aiProductIdeasResponseSchema = z.object({
  ideas: z.array(aiProductIdeaSchema).min(1),
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
    source: z.enum(['youtube_data', 'ai_estimate', 'search_data']).optional(),
    whyItCouldSell: z.string().optional(),
    productContents: z.array(z.string()).optional(),
    research: z.unknown().optional(),
    sourceData: z.unknown().optional(),
  }),
})

export interface ResearchTheme {
  theme: string
  seedQueries: string[]
}

export interface GenerateProductIdeasResult {
  ideas: ProductIdea[]
  source: ProductIdeaSource
  message: string | null
}

export const UNAVAILABLE_YOUTUBE: YouTubeSignal = {
  available: false,
  youtubeDemandScore: null,
  viewStrengthScore: null,
  breakoutStrengthScore: null,
  momentumScore: null,
  crossCreatorScore: null,
  relevantVideoCount: 0,
  breakoutVideoCount: 0,
  uniqueCreatorCount: 0,
  medianViews: null,
  topVideoViews: null,
  topBreakoutRatio: null,
  recentMomentum: 'unknown',
  examples: [],
}

export const UNAVAILABLE_TRENDS: GoogleTrendsSignal = {
  available: false,
  matched: false,
  searchTier: null,
  growthPercent: null,
  active: null,
}

export const UNAVAILABLE_PRODUCT_FIT: ProductFitSignal = {
  available: false,
  level: 'unknown',
  fitScore: null,
  reason: null,
}

export const UNAVAILABLE_SELLBOP: SellBopSignal = {
  available: false,
  demandScore: null,
  sampleSize: null,
  medianPriceCents: null,
  categoryProductCount: null,
  summary: null,
}

export function youtubeDemandLabel(score: number | null): string | null {
  if (score == null) return null
  if (score >= 85) return 'Very Strong'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Moderate'
  return 'Limited'
}

export function productFitLabel(level: ProductFitLevel): string | null {
  if (level === 'unknown') return null
  const map: Record<Exclude<ProductFitLevel, 'unknown'>, string> = {
    very_strong: 'Very Strong',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Weak',
  }
  return map[level]
}

export function breakoutLevel(ratio: number | null): BreakoutLevel {
  if (ratio == null || ratio < 3) return null
  if (ratio >= 10) return 'major'
  if (ratio >= 5) return 'strong'
  return 'breakout'
}
