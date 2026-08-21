import 'server-only'

import type { ProductIdea } from './types'

export function rowToProductIdea(row: Record<string, unknown>): ProductIdea {
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
    estimatedMonthlySearches: row.estimated_monthly_searches != null
      ? Number(row.estimated_monthly_searches)
      : null,
    cpc: row.cpc != null ? Number(row.cpc) : null,
    searchCompetition: row.search_competition != null ? Number(row.search_competition) : null,
    trend: (row.trend as ProductIdea['trend']) ?? 'unknown',
    trendPercent: row.trend_percent != null ? Number(row.trend_percent) : null,
    opportunityScore: row.opportunity_score != null ? Number(row.opportunity_score) : null,
    source: row.source === 'search_data' ? 'search_data' : 'ai_estimate',
    whyItCouldSell: String(row.why_it_could_sell ?? ''),
    productContents: Array.isArray(row.product_contents)
      ? row.product_contents.filter((k): k is string => typeof k === 'string')
      : [],
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
    estimated_monthly_searches: idea.estimatedMonthlySearches,
    cpc: idea.cpc,
    search_competition: idea.searchCompetition,
    trend: idea.trend,
    trend_percent: idea.trendPercent,
    opportunity_score: idea.opportunityScore,
    source: idea.source,
    why_it_could_sell: idea.whyItCouldSell,
    product_contents: idea.productContents,
    source_data: {
      primaryKeyword: idea.primaryKeyword,
      supportingKeywords: idea.supportingKeywords,
    },
    updated_at: new Date().toISOString(),
  }
}
