import 'server-only'

import type { ProductIdea, ProductIdeaResearch, ProductIdeaSource } from './types'

function parseResearch(sourceData: unknown): ProductIdeaResearch | undefined {
  if (!sourceData || typeof sourceData !== 'object') return undefined
  const data = sourceData as Record<string, unknown>
  if (data.research && typeof data.research === 'object') {
    return data.research as ProductIdeaResearch
  }
  return undefined
}

function parseSource(raw: unknown, research: ProductIdeaResearch | undefined): ProductIdeaSource {
  if (raw === 'youtube_data') return 'youtube_data'
  if (raw === 'search_data' && research?.youtube?.available) return 'youtube_data'
  if (raw === 'search_data') return 'ai_estimate'
  return 'ai_estimate'
}

export function rowToProductIdea(row: Record<string, unknown>): ProductIdea {
  const sourceData = row.source_data
  const research = parseResearch(sourceData)

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    hook: String(row.hook ?? ''),
    description: String(row.description ?? ''),
    targetAudience: String(row.target_audience ?? ''),
    category: String(row.category ?? ''),
    productType: (row.product_type as ProductIdea['productType']) ?? 'Other',
    suggestedPriceMinCents: Number(row.suggested_price_min_cents ?? 0),
    suggestedPriceMaxCents: Number(row.suggested_price_max_cents ?? 0),
    primaryKeyword: row.primary_keyword ? String(row.primary_keyword) : null,
    supportingKeywords: Array.isArray(row.supporting_keywords)
      ? row.supporting_keywords.filter((k): k is string => typeof k === 'string')
      : [],
    estimatedMonthlySearches: null,
    cpc: null,
    searchCompetition: null,
    trend: 'unknown',
    trendPercent: null,
    opportunityScore: row.opportunity_score != null ? Number(row.opportunity_score) : null,
    source: parseSource(row.source, research),
    whyItCouldSell: String(row.why_it_could_sell ?? ''),
    productContents: Array.isArray(row.product_contents)
      ? row.product_contents.filter((k): k is string => typeof k === 'string')
      : [],
    research,
  }
}

export function productIdeaToInsert(userId: string, storeId: string | null, idea: ProductIdea) {
  return {
    user_id: userId,
    store_id: storeId,
    title: idea.title,
    hook: idea.hook,
    description: idea.description,
    target_audience: idea.targetAudience,
    category: idea.category,
    product_type: idea.productType,
    suggested_price_min_cents: idea.suggestedPriceMinCents,
    suggested_price_max_cents: idea.suggestedPriceMaxCents,
    primary_keyword: idea.primaryKeyword,
    supporting_keywords: idea.supportingKeywords,
    estimated_monthly_searches: null,
    cpc: null,
    search_competition: null,
    trend: 'unknown',
    trend_percent: null,
    opportunity_score: idea.opportunityScore,
    source: idea.source,
    why_it_could_sell: idea.whyItCouldSell,
    product_contents: idea.productContents,
    source_data: {
      primaryKeyword: idea.primaryKeyword,
      supportingKeywords: idea.supportingKeywords,
      research: idea.research ?? null,
    },
    updated_at: new Date().toISOString(),
  }
}
