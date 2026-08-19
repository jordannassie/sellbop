/** SellBop Partner badge brand blue */
export const PARTNER_BADGE_BLUE = '#1D9BF0'

/** Official SellBop Partner badge icon (PNG). */
export const PARTNER_BADGE_ICON_URL =
  'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/logos/icon%20partner.png'

/** Badge shows only when admin granted partner status AND user keeps it visible. */
export function shouldShowPartnerBadge(
  isPartner: boolean | null | undefined,
  showPartnerBadge: boolean | null | undefined,
): boolean {
  return isPartner === true && showPartnerBadge !== false
}
