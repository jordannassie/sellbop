import type { Trend } from './types'

export interface MonthlySearchPoint {
  year: number
  month: number
  search_volume: number
}

/** Compare recent 3-month average vs prior 3-month average. */
export function calculateTrend(
  monthlySearches: MonthlySearchPoint[] | null | undefined,
): { trend: Trend; trendPercent: number | null } {
  if (!monthlySearches?.length || monthlySearches.length < 4) {
    return { trend: 'unknown', trendPercent: null }
  }

  const sorted = [...monthlySearches].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  )
  const recent = sorted.slice(-3)
  const previous = sorted.slice(-6, -3)
  if (previous.length < 3 || recent.length < 3) {
    return { trend: 'unknown', trendPercent: null }
  }

  const recentAvg = recent.reduce((sum, row) => sum + row.search_volume, 0) / recent.length
  const prevAvg = previous.reduce((sum, row) => sum + row.search_volume, 0) / previous.length

  if (prevAvg === 0) {
    if (recentAvg > 0) return { trend: 'rising', trendPercent: 100 }
    return { trend: 'stable', trendPercent: 0 }
  }

  const pct = ((recentAvg - prevAvg) / prevAvg) * 100
  let trend: Trend = 'stable'
  if (pct > 10) trend = 'rising'
  else if (pct < -10) trend = 'falling'

  return { trend, trendPercent: Math.round(pct * 10) / 10 }
}
