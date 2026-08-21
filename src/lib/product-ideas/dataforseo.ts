import 'server-only'

import { env } from '@/lib/env'
import { calculateTrend } from './trend'
import { calculateOpportunityScore } from './scoring'
import type { KeywordMetric } from './types'

const DATAFORSEO_BASE = 'https://api.dataforseo.com/v3'

/** United States location code for DataForSEO Google Ads. */
const US_LOCATION_CODE = 2840

export function isDataForSeoConfigured(): boolean {
  return !!(env.dataForSeo.login && env.dataForSeo.password)
}

function authHeader(): string {
  const login = env.dataForSeo.login!
  const password = env.dataForSeo.password!
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`
}

interface DataForSeoMonthlySearch {
  year?: number
  month?: number
  search_volume?: number
}

interface DataForSeoKeywordRow {
  keyword?: string
  keyword_info?: {
    search_volume?: number | null
    cpc?: number | null
    competition?: number | null
    competition_index?: number | null
    monthly_searches?: DataForSeoMonthlySearch[] | null
  } | null
}

function normalizeCompetition(value: number | null | undefined, index: number | null | undefined): number | null {
  if (typeof value === 'number' && value >= 0 && value <= 1) return value
  if (typeof index === 'number' && index >= 0) return Math.min(1, index / 100)
  return null
}

function rowToMetric(row: DataForSeoKeywordRow): KeywordMetric | null {
  const keyword = row.keyword?.trim()
  if (!keyword) return null

  const info = row.keyword_info
  const monthly = (info?.monthly_searches ?? [])
    .filter((m): m is Required<Pick<DataForSeoMonthlySearch, 'year' | 'month' | 'search_volume'>> =>
      typeof m.year === 'number'
      && typeof m.month === 'number'
      && typeof m.search_volume === 'number',
    )
    .map(m => ({ year: m.year, month: m.month, search_volume: m.search_volume }))

  const { trend, trendPercent } = calculateTrend(monthly)
  const searchVolume = typeof info?.search_volume === 'number' ? info.search_volume : null
  const cpc = typeof info?.cpc === 'number' ? info.cpc : null
  const competition = normalizeCompetition(info?.competition ?? null, info?.competition_index ?? null)

  const opportunityScore = calculateOpportunityScore({
    searchVolume,
    cpc,
    competition,
    trend,
  })

  return {
    keyword,
    searchVolume,
    cpc,
    competition,
    trend,
    trendPercent,
    opportunityScore,
    monthlySearches: monthly,
  }
}

/** Fetch related keywords for seed phrases in one batched live request. */
export async function fetchKeywordMetrics(seedKeywords: string[]): Promise<KeywordMetric[]> {
  if (!isDataForSeoConfigured()) return []

  const keywords = [...new Set(seedKeywords.map(k => k.trim()).filter(Boolean))].slice(0, 10)
  if (keywords.length === 0) return []

  const response = await fetch(`${DATAFORSEO_BASE}/keywords_data/google_ads/keywords_for_keywords/live`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        location_code: US_LOCATION_CODE,
        language_code: 'en',
        keywords,
      },
    ]),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[DataForSEO] keyword request failed:', response.status, text.slice(0, 500))
    return []
  }

  const payload = await response.json() as {
    tasks?: { result?: DataForSeoKeywordRow[] | null }[] | null
  }

  const rows = payload.tasks?.flatMap(task => task.result ?? []) ?? []
  const byKeyword = new Map<string, KeywordMetric>()

  for (const row of rows) {
    const metric = rowToMetric(row)
    if (!metric) continue
    const existing = byKeyword.get(metric.keyword.toLowerCase())
    if (!existing || (metric.searchVolume ?? 0) > (existing.searchVolume ?? 0)) {
      byKeyword.set(metric.keyword.toLowerCase(), metric)
    }
  }

  return [...byKeyword.values()]
    .filter(m => m.searchVolume != null && m.searchVolume > 0)
    .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))
}
