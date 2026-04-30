import { env } from '@/lib/env'

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getAppUrl() {
  return normalizeUrl(env.app.url)
}

export function getAuthCallbackUrl(origin?: string) {
  const base = origin ? normalizeUrl(origin) : getAppUrl()
  return `${base}/auth/callback`
}
