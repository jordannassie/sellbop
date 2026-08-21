import type { ProductIdea, ProductIdeaResearch } from './types'
import { aiEstimateLabel, productFitLabel } from './types'

export function opportunityScoreTone(score: number | null): 'high' | 'medium' | 'neutral' {
  if (score == null) return 'neutral'
  if (score >= 80) return 'high'
  if (score >= 65) return 'medium'
  return 'neutral'
}

export function sourceBadgeLabel(source: ProductIdea['source']): string {
  switch (source) {
    case 'google_trends':
    case 'google_trends_youtube':
      return 'Google Trends'
    case 'youtube':
      return 'YouTube Data'
    default:
      return 'AI Estimate'
  }
}

export function formatTrendingTraffic(label: string | null | undefined): string | null {
  if (!label) return null
  return `${label} trending searches`
}

export function buildEvidenceChips(idea: ProductIdea): string[] {
  const chips: string[] = []
  const research = idea.research
  const trend = research?.trendResearch

  if (idea.source === 'google_trends' || idea.source === 'google_trends_youtube') {
    chips.push('Trending Now')
    const traffic = formatTrendingTraffic(trend?.trafficLabel)
    if (traffic) chips.push(traffic)
  }

  if (research?.productFitScore != null) {
    chips.push(`Product Fit: ${productFitLabel(research.productFitScore)}`)
  }

  if (idea.source === 'ai_estimate' && idea.aiOpportunityEstimate != null) {
    chips.push(`AI Estimate: ${aiEstimateLabel(idea.aiOpportunityEstimate)}`)
  }

  return chips.slice(0, 5)
}

export function scoreDisplay(idea: ProductIdea): {
  label: string
  value: number | null
  tooltip: string
} {
  if (idea.source === 'google_trends' || idea.source === 'google_trends_youtube') {
    return {
      label: 'Opportunity',
      value: idea.opportunityScore,
      tooltip: "Combines current Google Trends activity with SellBop's assessment of product fit and staying power. It does not guarantee sales.",
    }
  }

  return {
    label: 'AI Estimate',
    value: idea.aiOpportunityEstimate,
    tooltip: 'AI assessment only — not validated by current Google Trends data.',
  }
}

/** @deprecated kept for legacy test script */
export function calculateOpportunityScore(input: {
  searchVolume: number | null
  cpc: number | null
  competition: number | null
  trend: import('./types').Trend
}): number | null {
  if (input.searchVolume == null || input.searchVolume <= 0) return null
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  const demand = clamp((Math.log10(input.searchVolume + 1) / 5) * 100) * 0.4
  const trendMap = { rising: 100, stable: 60, falling: 25, unknown: 50 }
  const trend = trendMap[input.trend] * 0.3
  const intent = clamp(((input.cpc ?? 0) / 5) * 100) * 0.15
  const competition = clamp((1 - (input.competition ?? 0.5)) * 100) * 0.15
  return Math.round(clamp(demand + trend + intent + competition))
}

export {
  calculateGoogleTrendsOpportunityScore,
  trendActivityScore,
  parseTrafficLabel,
  findVerifiedTrendItem,
} from './google-trends-parser'
