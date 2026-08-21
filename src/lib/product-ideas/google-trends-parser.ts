/**
 * Pure Google Trends RSS parsing utilities (no server-only — safe for tests).
 */

import { XMLParser } from 'fast-xml-parser'

export interface GoogleTrendItem {
  query: string
  normalizedQuery: string
  trafficLabel: string | null
  trafficApprox: number | null
  publishedAt: string | null
  relatedTitles: string[]
  relatedUrls: string[]
  source: 'google_trends'
}

export const GOOGLE_TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=US'
export const GOOGLE_TRENDS_PAGE_URL = 'https://trends.google.com/trending?geo=US'

export function normalizeTrendQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Parse Google traffic labels like 200+, 2K+, 20K+, 100K+, 1M+ */
export function parseTrafficLabel(label: string | null | undefined): {
  trafficLabel: string | null
  trafficApprox: number | null
} {
  if (!label || typeof label !== 'string') {
    return { trafficLabel: null, trafficApprox: null }
  }

  const trimmed = label.trim()
  if (!trimmed) return { trafficLabel: null, trafficApprox: null }

  const match = trimmed.match(/^([\d,.]+)\s*(K|M)?\+?$/i)
  if (!match) {
    return { trafficLabel: trimmed, trafficApprox: null }
  }

  let value = parseFloat(match[1].replace(/,/g, ''))
  if (Number.isNaN(value)) {
    return { trafficLabel: trimmed, trafficApprox: null }
  }

  const suffix = match[2]?.toUpperCase()
  if (suffix === 'K') value *= 1_000
  if (suffix === 'M') value *= 1_000_000

  return {
    trafficLabel: trimmed.endsWith('+') ? trimmed : `${trimmed.replace(/\+?$/, '')}+`,
    trafficApprox: Math.round(value),
  }
}

export function trendActivityScore(trafficApprox: number | null): number {
  if (trafficApprox == null || trafficApprox <= 0) return 25
  if (trafficApprox >= 1_000_000) return 100
  if (trafficApprox >= 100_000) return 90
  if (trafficApprox >= 20_000) return 78
  if (trafficApprox >= 2_000) return 62
  if (trafficApprox >= 200) return 45
  return 30
}

export function trendFreshnessScore(publishedAt: string | null): number {
  if (!publishedAt) return 50
  const then = new Date(publishedAt).getTime()
  if (Number.isNaN(then)) return 50
  const hours = (Date.now() - then) / (1000 * 60 * 60)
  if (hours <= 6) return 100
  if (hours <= 24) return 90
  if (hours <= 72) return 75
  if (hours <= 168) return 60
  return 45
}

export function googleTrendExploreUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    geo: 'US',
  })
  return `https://trends.google.com/trends/explore?${params.toString()}`
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function extractNewsItems(item: Record<string, unknown>): { titles: string[]; urls: string[] } {
  const titles: string[] = []
  const urls: string[] = []

  const newsBlocks = asArray(item.news_item ?? item['ht:news_item'])
  for (const block of newsBlocks) {
    if (!block || typeof block !== 'object') continue
    const news = block as Record<string, unknown>
    const title = news.news_item_title ?? news['ht:news_item_title']
    const url = news.news_item_url ?? news['ht:news_item_url']
    if (typeof title === 'string' && title.trim()) titles.push(title.trim())
    if (typeof url === 'string' && url.trim()) urls.push(url.trim())
  }

  return { titles, urls }
}

/** Parse Google Trends Trending Now RSS XML into normalized items. */
export function parseGoogleTrendsRss(xml: string): GoogleTrendItem[] {
  if (!xml.trim()) return []

  // XMLParser from fast-xml-parser
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    trimValues: true,
    isArray: (name) => name === 'item' || name === 'news_item',
  })

  let parsed: unknown
  try {
    parsed = parser.parse(xml)
  } catch {
    return []
  }

  const channel = (parsed as { rss?: { channel?: { item?: unknown } } })?.rss?.channel
  const rawItems = asArray(channel?.item)

  const results: GoogleTrendItem[] = []

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!title) continue

    const trafficRaw = typeof item.approx_traffic === 'string'
      ? item.approx_traffic
      : typeof item['ht:approx_traffic'] === 'string'
        ? item['ht:approx_traffic']
        : null

    const { trafficLabel, trafficApprox } = parseTrafficLabel(trafficRaw)
    const pubDate = typeof item.pubDate === 'string' ? item.pubDate : null
    const { titles, urls } = extractNewsItems(item)

    results.push({
      query: title,
      normalizedQuery: normalizeTrendQuery(title),
      trafficLabel,
      trafficApprox,
      publishedAt: pubDate,
      relatedTitles: titles,
      relatedUrls: urls,
      source: 'google_trends',
    })
  }

  return results
}

export function findVerifiedTrendItem(
  items: GoogleTrendItem[],
  sourceTrendQuery: string | null | undefined,
): GoogleTrendItem | null {
  if (!sourceTrendQuery?.trim() || items.length === 0) return null

  const target = normalizeTrendQuery(sourceTrendQuery)

  const exact = items.find(i => i.normalizedQuery === target)
  if (exact) return exact

  const contains = items.find(i =>
    i.normalizedQuery.includes(target) || target.includes(i.normalizedQuery),
  )
  return contains ?? null
}

export function calculateGoogleTrendsOpportunityScore(input: {
  trafficApprox: number | null
  publishedAt: string | null
  productFitScore: number
  evergreenScore: number
}): number {
  const activity = trendActivityScore(input.trafficApprox)
  const freshness = trendFreshnessScore(input.publishedAt)
  const fit = Math.min(100, Math.max(0, input.productFitScore))
  const evergreen = Math.min(100, Math.max(0, input.evergreenScore))

  return Math.round(
    activity * 0.45
    + freshness * 0.20
    + fit * 0.20
    + evergreen * 0.15,
  )
}

export function aiOpportunityEstimate(input: {
  productFitScore: number
  evergreenScore: number
}): number {
  const fit = Math.min(100, Math.max(0, input.productFitScore))
  const evergreen = Math.min(100, Math.max(0, input.evergreenScore))
  return Math.round(fit * 0.65 + evergreen * 0.35)
}

export function aiEstimateLabel(score: number): string {
  if (score >= 80) return 'Strong'
  if (score >= 65) return 'Moderate'
  if (score >= 50) return 'Fair'
  return 'Limited'
}
