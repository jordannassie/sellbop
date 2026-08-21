import 'server-only'

import type { ProductIdeasLogger } from '../logger'
import {
  GOOGLE_TRENDS_RSS_URL,
  parseGoogleTrendsRss,
  type GoogleTrendItem,
} from '../google-trends-parser'

const FETCH_TIMEOUT_MS = 8_000

export interface GoogleTrendsFeedResult {
  available: boolean
  items: GoogleTrendItem[]
  fetchedAt: string
  error: string | null
}

let memoryCache: { expiresAt: number; result: GoogleTrendsFeedResult } | null = null
const MEMORY_TTL_MS = 10 * 60 * 1000

/** Fetch the Google Trends Trending Now RSS feed once (cached ~10 min in-process). */
export async function fetchGoogleTrendsFeed(log?: ProductIdeasLogger): Promise<GoogleTrendsFeedResult> {
  const now = Date.now()
  if (memoryCache && memoryCache.expiresAt > now) {
    log?.info(`google-trends cache hit (${memoryCache.result.items.length} items)`)
    return memoryCache.result
  }

  const fetchFeed = async (): Promise<GoogleTrendsFeedResult> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(GOOGLE_TRENDS_RSS_URL, {
        headers: {
          'User-Agent': 'SellBop-ProductIdeas/1.0 (+https://sellbop.com)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: controller.signal,
        next: { revalidate: 600 },
      })

      if (!response.ok) {
        return {
          available: false,
          items: [],
          fetchedAt: new Date().toISOString(),
          error: `HTTP ${response.status}`,
        }
      }

      const xml = await response.text()
      const items = parseGoogleTrendsRss(xml)

      return {
        available: items.length > 0,
        items,
        fetchedAt: new Date().toISOString(),
        error: items.length > 0 ? null : 'No trend items parsed',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fetch failed'
      log?.error('google-trends failed', err)
      return {
        available: false,
        items: [],
        fetchedAt: new Date().toISOString(),
        error: message,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  const result = log
    ? await log.timed('google-trends', fetchFeed)
    : await fetchFeed()

  memoryCache = { expiresAt: now + MEMORY_TTL_MS, result }
  return result
}
