import type { Trend } from './types'

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeSearchVolume(volume: number): number {
  if (volume <= 0) return 0
  const log = Math.log10(volume + 1)
  return clamp((log / 5) * 100)
}

function trendComponent(trend: Trend): number {
  switch (trend) {
    case 'rising':
      return 100
    case 'stable':
      return 60
    case 'falling':
      return 25
    default:
      return 50
  }
}

function cpcComponent(cpc: number): number {
  return clamp((cpc / 5) * 100)
}

/** Lower Google Ads competition → higher score component. */
function competitionComponent(competition: number): number {
  return clamp((1 - competition) * 100)
}

export function calculateOpportunityScore(input: {
  searchVolume: number | null
  cpc: number | null
  competition: number | null
  trend: Trend
}): number | null {
  if (input.searchVolume == null || input.searchVolume <= 0) return null

  const demand = normalizeSearchVolume(input.searchVolume) * 0.4
  const trend = trendComponent(input.trend) * 0.3
  const intent = cpcComponent(input.cpc ?? 0) * 0.15
  const competition = competitionComponent(input.competition ?? 0.5) * 0.15

  return Math.round(clamp(demand + trend + intent + competition))
}

export function demandLabel(searchVolume: number | null): string | null {
  if (searchVolume == null) return null
  if (searchVolume >= 10000) return 'High Demand'
  if (searchVolume >= 2500) return 'Medium Demand'
  return 'Niche Demand'
}

export function competitionLabel(competition: number | null): string | null {
  if (competition == null) return null
  if (competition < 0.33) return 'Low Search Competition'
  if (competition < 0.66) return 'Medium Search Competition'
  return 'High Search Competition'
}

export function trendLabel(trend: Trend): string | null {
  if (trend === 'unknown') return null
  return trend.charAt(0).toUpperCase() + trend.slice(1)
}

export function opportunityScoreTone(score: number | null): 'high' | 'medium' | 'neutral' {
  if (score == null) return 'neutral'
  if (score >= 80) return 'high'
  if (score >= 65) return 'medium'
  return 'neutral'
}
