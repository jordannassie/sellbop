import { slugify } from '@/lib/utils'

/** Central reserved shop slug list — shared by API validation and route guards. */
export const RESERVED_STORE_SLUGS = new Set([
  'dashboard',
  'admin',
  'api',
  'p',
  'store',
  'marketplace',
  'pricing',
  'login',
  'signup',
  'settings',
  'products',
  'checkout',
  'library',
  'community',
  'mission',
  'university',
  'about',
  'terms',
  'privacy',
  'refund-policy',
  'start-selling',
  'demo',
  'internal',
  'app',
  'www',
  'help',
  'support',
  'school',
  'partners',
  'purchases',
  'auth',
  'resources',
  'affiliates',
  'payouts',
  'oauth',
  'preview',
  'partner',
  'access',
  'earnings',
  'sales',
  'orders',
  'customers',
  'discounts',
  'ai-agent',
  'ai-launch',
])

export const MIN_STORE_SLUG_LENGTH = 3
export const MAX_STORE_SLUG_LENGTH = 40

export function normalizeStoreSlug(raw: string): string {
  return slugify(raw.trim()).slice(0, MAX_STORE_SLUG_LENGTH)
}

export function validateStoreSlug(value: string): string | null {
  if (!value || value.length < MIN_STORE_SLUG_LENGTH) return 'Must be at least 3 characters.'
  if (value.length > MAX_STORE_SLUG_LENGTH) return `Must be at most ${MAX_STORE_SLUG_LENGTH} characters.`
  if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens allowed.'
  if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a hyphen.'
  if (RESERVED_STORE_SLUGS.has(value)) return 'This link is reserved and cannot be used.'
  return null
}
