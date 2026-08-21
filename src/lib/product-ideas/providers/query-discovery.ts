import 'server-only'

import { cached, cacheKey, CACHE_TTL } from '../cache'
import type { QuerySignal } from '../types'

const SUGGEST_URL = 'https://suggestqueries.google.com/complete/search'

async function fetchAutocompleteSuggestions(seed: string): Promise<string[]> {
  const url = new URL(SUGGEST_URL)
  url.searchParams.set('client', 'firefox')
  url.searchParams.set('q', seed.trim())

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) return []

  const raw = await response.text()
  try {
    const parsed = JSON.parse(raw) as [string, string[]]
    const suggestions = parsed[1]
    if (!Array.isArray(suggestions)) return []
    return suggestions.filter((s): s is string => typeof s === 'string' && s.trim().length > 2)
  } catch {
    return []
  }
}

/** Discover related problem queries via public autocomplete — no search volume numbers. */
export async function discoverRelatedQueries(seeds: string[]): Promise<QuerySignal[]> {
  const uniqueSeeds = [...new Set(seeds.map(s => s.trim()).filter(Boolean))].slice(0, 5)
  if (uniqueSeeds.length === 0) return []

  return cached(cacheKey('query-discovery', uniqueSeeds), CACHE_TTL.searchKeywords, async () => {
    const results: QuerySignal[] = []
    const seen = new Set<string>()

    for (const seed of uniqueSeeds) {
      seen.add(seed.toLowerCase())
      results.push({ query: seed, source: 'ai' })

      try {
        const suggestions = await fetchAutocompleteSuggestions(seed)
        for (const suggestion of suggestions.slice(0, 6)) {
          const key = suggestion.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          results.push({ query: suggestion, source: 'autocomplete' })
        }
      } catch {
        // Skip failed autocomplete — continue with AI seeds
      }
    }

    return results.slice(0, 30)
  })
}

export function queriesForTheme(allQueries: QuerySignal[], theme: string, aiSeeds: string[]): QuerySignal[] {
  const themeLower = theme.toLowerCase()
  const themeWords = themeLower.split(/\s+/).filter(w => w.length > 2)

  const matched = allQueries.filter(q => {
    const ql = q.query.toLowerCase()
    return ql.includes(themeLower) || themeWords.some(w => ql.includes(w))
  })

  const seeds = aiSeeds.map(s => ({ query: s, source: 'ai' as const }))
  const combined = [...seeds, ...matched]
  const seen = new Set<string>()
  return combined.filter(q => {
    const key = q.query.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 12)
}
