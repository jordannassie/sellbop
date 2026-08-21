import {
  productFitLabel,
  youtubeDemandLabel as youtubeScoreLabel,
  type ProductFitLevel,
} from './types'
import type { GoogleTrendsSignal, ProductIdeaResearch, SellBopSignal, YouTubeSignal } from './types'

export function opportunityScoreTone(score: number | null): 'high' | 'medium' | 'neutral' {
  if (score == null) return 'neutral'
  if (score >= 80) return 'high'
  if (score >= 65) return 'medium'
  return 'neutral'
}

export function youtubeDemandChip(signal: YouTubeSignal | undefined): string | null {
  if (!signal?.available || signal.youtubeDemandScore == null) return null
  const label = youtubeScoreLabel(signal.youtubeDemandScore)
  return label ? `YouTube Demand: ${label}` : null
}

export function breakoutChip(signal: YouTubeSignal | undefined): string | null {
  if (!signal?.available || signal.breakoutVideoCount === 0) return null
  if (signal.breakoutVideoCount === 1) return '1 Breakout Video'
  return `${signal.breakoutVideoCount} Breakout Videos`
}

export function momentumChip(signal: YouTubeSignal | undefined): string | null {
  if (!signal?.available) return null
  switch (signal.recentMomentum) {
    case 'rising': return 'Recent Momentum: Rising'
    case 'strong': return 'Recent Momentum: Strong'
    case 'moderate': return 'Recent Momentum: Moderate'
    default: return null
  }
}

export function productFitChip(level: ProductFitLevel | undefined): string | null {
  if (!level || level === 'unknown') return null
  const label = productFitLabel(level)
  return label ? `Product Fit: ${label}` : null
}

export function googleTrendChip(signal: GoogleTrendsSignal | undefined): string | null {
  if (!signal?.available || !signal.matched || !signal.active) return null
  const tier = signal.searchTier ? ` (${signal.searchTier})` : ''
  return `Google Trend: Active${tier}`
}

export function sellbopChipLabel(signal: SellBopSignal | undefined): string | null {
  if (!signal?.available) return null
  return 'SellBop Data'
}

export function sourceBadgeLabel(source: 'youtube_data' | 'ai_estimate'): string {
  return source === 'youtube_data' ? 'YouTube Data' : 'AI Estimate'
}

export function buildEvidenceChips(research: ProductIdeaResearch | undefined): string[] {
  if (!research) return []

  const chips: string[] = []

  const ytDemand = youtubeDemandChip(research.youtube)
  if (ytDemand) chips.push(ytDemand)

  const breakout = breakoutChip(research.youtube)
  if (breakout) chips.push(breakout)

  const momentum = momentumChip(research.youtube)
  if (momentum) chips.push(momentum)

  const fit = productFitChip(research.productFit?.level)
  if (fit) chips.push(fit)

  const trend = googleTrendChip(research.trends)
  if (trend) chips.push(trend)

  const sb = sellbopChipLabel(research.sellbop)
  if (sb) chips.push(sb)

  return chips.slice(0, 5)
}

export function formatBreakoutRatio(ratio: number | null): string | null {
  if (ratio == null) return null
  return `${ratio.toFixed(1)}x`
}

export { calculateCombinedOpportunityScore, calculateOpportunityScore } from './opportunity-engine'
