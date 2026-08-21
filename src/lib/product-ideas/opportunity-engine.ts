import type { ProductIdeaResearch, ProductIdeaSource } from './types'

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

const WEIGHTS = {
  youtubeDemand: 0.40,
  momentum: 0.20,
  breakoutStrength: 0.15,
  crossCreator: 0.10,
  productFit: 0.15,
} as const

export function calculateCombinedOpportunityScore(research: ProductIdeaResearch): number | null {
  const youtube = research.youtube
  if (!youtube?.available || youtube.youtubeDemandScore == null) {
    return null
  }

  const components: { weight: number; score: number }[] = [
    { weight: WEIGHTS.youtubeDemand, score: youtube.youtubeDemandScore },
  ]

  if (youtube.momentumScore != null) {
    components.push({ weight: WEIGHTS.momentum, score: youtube.momentumScore })
  }
  if (youtube.breakoutStrengthScore != null) {
    components.push({ weight: WEIGHTS.breakoutStrength, score: youtube.breakoutStrengthScore })
  }
  if (youtube.crossCreatorScore != null) {
    components.push({ weight: WEIGHTS.crossCreator, score: youtube.crossCreatorScore })
  }
  if (research.productFit?.fitScore != null) {
    components.push({ weight: WEIGHTS.productFit, score: research.productFit.fitScore })
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight <= 0) return null

  let score = components.reduce(
    (sum, c) => sum + c.score * (c.weight / totalWeight),
    0,
  )

  const trends = research.trends
  if (trends?.available && trends.matched && trends.active) {
    const bonus = trends.growthPercent != null
      ? Math.min(5, trends.growthPercent / 20)
      : 3
    score += bonus
  }

  if (research.sellbop?.available && research.sellbop.demandScore != null) {
    score += Math.min(3, research.sellbop.demandScore / 35)
  }

  return Math.round(clamp(score))
}

export function resolveIdeaSource(research: ProductIdeaResearch | undefined): ProductIdeaSource {
  if (research?.youtube?.available && research.youtube.youtubeDemandScore != null) {
    return 'youtube_data'
  }
  return 'ai_estimate'
}

export function buildResearchBrief(research: ProductIdeaResearch): string {
  const lines: string[] = []

  if (research.theme) lines.push(`Theme: ${research.theme}`)

  const y = research.youtube
  if (y?.available) {
    lines.push(
      `YouTube: demand ${y.youtubeDemandScore}/100, ${y.relevantVideoCount} videos, ${y.breakoutVideoCount} breakout videos, momentum ${y.recentMomentum}`,
    )
    if (y.examples.length > 0) {
      lines.push(`Sample videos: ${y.examples.slice(0, 3).map(v => v.title).join('; ')}`)
    }
  }

  const t = research.trends
  if (t?.available && t.matched) {
    lines.push(`Google Trend: active${t.searchTier ? ` (${t.searchTier})` : ''}`)
  }

  const pf = research.productFit
  if (pf?.available) {
    lines.push(`Product Fit (${pf.level}): ${pf.reason ?? ''}`)
  }

  const queries = research.queries
  if (queries?.length) {
    lines.push(`Related problems: ${queries.slice(0, 6).map(q => q.query).join('; ')}`)
  }

  const sb = research.sellbop
  if (sb?.available) {
    lines.push(`SellBop data: ${sb.summary ?? ''}`)
  }

  return lines.join('\n')
}

/** @deprecated V1 scoring — kept for legacy test script */
export function calculateOpportunityScore(input: {
  searchVolume: number | null
  cpc: number | null
  competition: number | null
  trend: import('./types').Trend
}): number | null {
  if (input.searchVolume == null || input.searchVolume <= 0) return null
  const demand = clamp((Math.log10(input.searchVolume + 1) / 5) * 100) * 0.4
  const trendMap = { rising: 100, stable: 60, falling: 25, unknown: 50 }
  const trend = trendMap[input.trend] * 0.3
  const intent = clamp(((input.cpc ?? 0) / 5) * 100) * 0.15
  const competition = clamp((1 - (input.competition ?? 0.5)) * 100) * 0.15
  return Math.round(clamp(demand + trend + intent + competition))
}
