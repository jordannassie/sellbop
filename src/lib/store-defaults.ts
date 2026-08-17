/** Default SellBop store banner — shown when no custom banner is set. */
export const DEFAULT_STORE_BANNER_URL =
  'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/banners/Sell.png'

export function resolveStoreBannerUrl(bannerUrl: string | null | undefined): string {
  const trimmed = bannerUrl?.trim()
  if (trimmed) return trimmed
  return DEFAULT_STORE_BANNER_URL
}

export function isCustomStoreBanner(bannerUrl: string | null | undefined): boolean {
  const trimmed = bannerUrl?.trim()
  if (!trimmed) return false
  return trimmed !== DEFAULT_STORE_BANNER_URL
}
