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
])

export function validateStoreSlug(value: string): string | null {
  if (!value || value.length < 3) return 'Must be at least 3 characters.'
  if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and dashes allowed.'
  if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a dash.'
  if (RESERVED_STORE_SLUGS.has(value)) return 'This link is reserved and cannot be used.'
  return null
}
