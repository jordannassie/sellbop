import 'server-only'

import { cached, cacheKey, CACHE_TTL } from '../cache'
import type { GoogleTrendsSignal } from '../types'
import { UNAVAILABLE_TRENDS } from '../types'

const TRENDING_RSS = 'https://trends.google.com/trending/rss?geo=US'

interface TrendingItem {
  title: string
  traffic: string | null
}

function parseTrafficToPercent(traffic: string | null): number | null {
  if (!traffic) return null
  const t = traffic.toUpperCase().replace(/\+/g, '').trim()
  const match = t.match(/^([\d.]+)\s*(K|M)?/)
  if (!match) return null
  let n = parseFloat(match[1])
  if (match[2] === 'K') n *= 1000
  if (match[2] === 'M') n *= 1_000_000
  if (n >= 500_000) return 100
  if (n >= 100_000) return 85
  if (n >= 50_000) return 70
  if (n >= 10_000) return 50
  return 30
}

async function fetchTrendingItems(): Promise<TrendingItem[]> {
  const response = await fetch(TRENDING_RSS, {
    headers: { 'User-Agent': 'SellBop-ProductIdeas/1.0' },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  })

  if (!response.ok) return []

  const xml = await response.text()
  const items: TrendingItem[] = []
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  for (const block of itemBlocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
    const traffic = block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() ?? null
    if (title) items.push({ title, traffic })
  }

  return items
}

function themeMatchesTrend(theme: string, trendTitle: string): boolean {
  const themeWords = theme.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const titleLower = trendTitle.toLowerCase()
  if (titleLower.includes(theme.toLowerCase())) return true
  const matches = themeWords.filter(w => titleLower.includes(w))
  return matches.length >= Math.min(2, themeWords.length)
}

/** Match a theme against Google's public Trending Now RSS feed (US). */
export async function fetchGoogleTrendsSignal(theme: string): Promise<GoogleTrendsSignal> {
  if (!theme.trim()) return { ...UNAVAILABLE_TRENDS }

  return cached(cacheKey('google-trends-rss', [theme]), CACHE_TTL.googleTrends, async () => {
    try {
      const items = await fetchTrendingItems()
      if (items.length === 0) return { ...UNAVAILABLE_TRENDS }

      for (const item of items) {
        if (!themeMatchesTrend(theme, item.title)) continue

        return {
          available: true,
          matched: true,
          searchTier: item.traffic,
          growthPercent: parseTrafficToPercent(item.traffic),
          active: true,
        }
      }

      return {
        available: true,
        matched: false,
        searchTier: null,
        growthPercent: null,
        active: false,
      }
    } catch (err) {
      console.error('[Google Trends RSS]', err)
      return { ...UNAVAILABLE_TRENDS }
    }
  })
}
