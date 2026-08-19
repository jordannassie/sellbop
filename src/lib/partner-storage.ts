import { shouldShowPartnerBadge } from '@/lib/partner-badge'

/** Internal store.social_links keys until profiles migration is applied in Supabase. */
export const PARTNER_SOCIAL_IS_KEY = '__sellbop_is_partner'
export const PARTNER_SOCIAL_SHOW_KEY = '__sellbop_show_partner_badge'

export interface PartnerStatus {
  isPartner: boolean
  showPartnerBadge: boolean
}

/** Default ON — badge hidden only when explicitly set to "0". */
export function partnerFromSocialLinks(
  socialLinks: Record<string, string> | null | undefined,
): PartnerStatus {
  const links = socialLinks ?? {}
  return {
    isPartner: links[PARTNER_SOCIAL_IS_KEY] !== '0',
    showPartnerBadge: links[PARTNER_SOCIAL_SHOW_KEY] !== '0',
  }
}

export function withPartnerSocialLinks(
  socialLinks: Record<string, string> | null | undefined,
  status: PartnerStatus,
): Record<string, string> {
  const links = { ...(socialLinks ?? {}) }
  links[PARTNER_SOCIAL_IS_KEY] = status.isPartner ? '1' : '0'
  links[PARTNER_SOCIAL_SHOW_KEY] = status.showPartnerBadge ? '1' : '0'
  return links
}

export function stripPartnerSocialLinks(
  socialLinks: Record<string, string> | null | undefined,
): Record<string, string> {
  if (!socialLinks) return {}
  return Object.fromEntries(
    Object.entries(socialLinks).filter(([key]) => !key.startsWith('__sellbop_')),
  )
}

export function isMissingPartnerColumnsError(message: string | undefined): boolean {
  if (!message) return false
  return message.includes('is_partner') || message.includes('show_partner_badge')
}

export function resolvePartnerStatus(
  profile: { is_partner?: boolean | null; show_partner_badge?: boolean | null } | null,
  socialLinks: Record<string, string> | null | undefined,
  profileColumnsAvailable: boolean,
): PartnerStatus {
  if (profileColumnsAvailable && profile) {
    return {
      isPartner: profile.is_partner === true,
      showPartnerBadge: profile.show_partner_badge !== false,
    }
  }
  return partnerFromSocialLinks(socialLinks)
}

export function partnerBadgeVisible(status: PartnerStatus): boolean {
  return shouldShowPartnerBadge(status.isPartner, status.showPartnerBadge)
}
