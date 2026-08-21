import 'server-only'

/** Simple TTL cache for provider responses (per server instance). */
const store = new Map<string, { expiresAt: number; value: unknown }>()

export const CACHE_TTL = {
  searchKeywords: 7 * 24 * 60 * 60 * 1000,
  youtube: 48 * 60 * 60 * 1000,
  googleTrends: 24 * 60 * 60 * 1000,
  competitors: 5 * 24 * 60 * 60 * 1000,
  sellbop: 3 * 60 * 60 * 1000,
} as const

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) return hit.value as T

  const value = await loader()
  store.set(key, { expiresAt: now + ttlMs, value })
  return value
}

export function cacheKey(prefix: string, parts: string[]): string {
  return `${prefix}:${parts.map(p => p.trim().toLowerCase()).join('|')}`
}
