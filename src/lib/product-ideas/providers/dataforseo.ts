/** @deprecated Future optional provider — not used in V1 */
import 'server-only'

import { env } from '@/lib/env'
import { cached, cacheKey, CACHE_TTL } from '../cache'
import { calculateTrend } from '../trend'
import type { KeywordMetric, SearchSignal } from './legacy-types'
import { UNAVAILABLE_SEARCH } from './legacy-types'

const DATAFORSEO_BASE = 'https://api.dataforseo.com/v3'
const US_LOCATION_CODE = 2840

export function isDataForSeoConfigured(): boolean {
  return !!(env.dataForSeo.login && env.dataForSeo.password)
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${env.dataForSeo.login}:${env.dataForSeo.password}`).toString('base64')}`
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
      typeof m.year === 'number' && typeof m.month === 'number' && typeof m.search_volume === 'number',
    )
    .map(m => ({ year: m.year, month: m.month, search_volume: m.search_volume }))

  const { trend, trendPercent } = calculateTrend(monthly)
  const searchVolume = typeof info?.search_volume === 'number' ? info.search_volume : null
  const cpc = typeof info?.cpc === 'number' ? info.cpc : null
  const competition = normalizeCompetition(info?.competition ?? null, info?.competition_index ?? null)

  return {
    keyword,
    searchVolume,
    cpc,
    competition,
    trend,
    trendPercent,
    opportunityScore: null,
    monthlySearches: monthly,
  }
}

export function metricToSearchSignal(metric: KeywordMetric, supporting: string[] = []): SearchSignal {
  return {
    available: metric.searchVolume != null && metric.searchVolume > 0,
    primaryKeyword: metric.keyword,
    supportingKeywords: supporting,
    estimatedMonthlySearches: metric.searchVolume,
    cpc: metric.cpc,
    searchCompetition: metric.competition,
    trend: metric.trend,
    trendPercent: metric.trendPercent,
  }
}

/** Fetch related keywords for seed phrases in one batched live request. */
export async function fetchKeywordMetrics(seedKeywords: string[]): Promise<KeywordMetric[]> {
  if (!isDataForSeoConfigured()) return []

  const keywords = [...new Set(seedKeywords.map(k => k.trim()).filter(Boolean))].slice(0, 10)
  if (keywords.length === 0) return []

  return cached(cacheKey('dfs-keywords', keywords), CACHE_TTL.searchKeywords, async () => {
    const response = await fetch(`${DATAFORSEO_BASE}/keywords_data/google_ads/keywords_for_keywords/live`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        location_code: US_LOCATION_CODE,
        language_code: 'en',
        keywords,
      }]),
    })

    if (!response.ok) {
      console.error('[DataForSEO] keyword request failed:', response.status)
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
      .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
  })
}

export interface SerpOrganicItem {
  title: string
  url: string
  description: string | null
}

/** Fetch top organic SERP results for competitor gap analysis. */
export async function fetchSerpOrganic(keyword: string): Promise<SerpOrganicItem[]> {
  if (!isDataForSeoConfigured() || !keyword.trim()) return []

  return cached(cacheKey('dfs-serp', [keyword]), CACHE_TTL.competitors, async () => {
    const response = await fetch(`${DATAFORSEO_BASE}/serp/google/organic/live/advanced`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword: keyword.trim(),
        location_code: US_LOCATION_CODE,
        language_code: 'en',
        depth: 10,
      }]),
    })

    if (!response.ok) {
      console.error('[DataForSEO] SERP request failed:', response.status)
      return []
    }

    const payload = await response.json() as {
      tasks?: { result?: { items?: { type?: string; title?: string; url?: string; description?: string }[] }[] | null }[] | null
    }

    const items = payload.tasks?.[0]?.result?.[0]?.items ?? []
    return items
      .filter(item => item.type === 'organic' && item.title && item.url)
      .slice(0, 10)
      .map(item => ({
        title: item.title!,
        url: item.url!,
        description: item.description ?? null,
      }))
  })
}

export function emptySearchSignal(): SearchSignal {
  return { ...UNAVAILABLE_SEARCH }
}
