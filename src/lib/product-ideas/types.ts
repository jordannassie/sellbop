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

export type ProductIdeaSource = 'search_data' | 'ai_estimate'

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
  estimatedMonthlySearches: number | null
  cpc: number | null
  searchCompetition: number | null
  trend: Trend
  trendPercent: number | null
  opportunityScore: number | null
  source: ProductIdeaSource
  whyItCouldSell: string
  productContents: string[]
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
    source: z.enum(['search_data', 'ai_estimate']).optional(),
    whyItCouldSell: z.string().optional(),
    productContents: z.array(z.string()).optional(),
    sourceData: z.unknown().optional(),
  }),
})

export interface KeywordMetric {
  keyword: string
  searchVolume: number | null
  cpc: number | null
  competition: number | null
  trend: Trend
  trendPercent: number | null
  opportunityScore: number | null
  monthlySearches?: { year: number; month: number; search_volume: number }[]
}

export interface GenerateProductIdeasResult {
  ideas: ProductIdea[]
  source: ProductIdeaSource
  message: string | null
}
