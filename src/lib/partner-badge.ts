/** SellBop Partner badge brand blue */
export const PARTNER_BADGE_BLUE = '#1D9BF0'

/** Badge shows only when admin granted partner status AND user keeps it visible. */
export function shouldShowPartnerBadge(
  isPartner: boolean | null | undefined,
  showPartnerBadge: boolean | null | undefined,
): boolean {
  return isPartner === true && showPartnerBadge !== false
}
