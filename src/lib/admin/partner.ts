import 'server-only'

import {
  isMissingPartnerColumnsError,
  partnerFromSocialLinks,
  type PartnerStatus,
  withPartnerSocialLinks,
} from '@/lib/partner-storage'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

async function getStoreForUser(userId: string) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('stores')
    .select('id, social_links')
    .eq('owner_user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function writeStorePartnerStatus(userId: string, status: PartnerStatus) {
  const store = await getStoreForUser(userId)
  if (!store) {
    throw new Error('User has no store — partner badge requires a public storefront.')
  }

  const admin = getSupabaseAdminClient()
  const socialLinks = withPartnerSocialLinks(
    (store.social_links as Record<string, string> | null) ?? {},
    status,
  )

  const { error } = await admin
    .from('stores')
    .update({ social_links: socialLinks, updated_at: new Date().toISOString() })
    .eq('id', store.id)

  if (error) throw error
  return status
}

async function writeProfilePartnerStatus(userId: string, status: PartnerStatus): Promise<boolean> {
  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      is_partner: status.isPartner,
      show_partner_badge: status.showPartnerBadge,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (!error) return true
  if (isMissingPartnerColumnsError(error.message)) return false
  throw error
}

export async function setUserPartnerStatus(userId: string, isPartner: boolean) {
  const status: PartnerStatus = {
    isPartner,
    showPartnerBadge: isPartner,
  }

  await writeStorePartnerStatus(userId, status)
  await writeProfilePartnerStatus(userId, status)

  return { userId, ...status }
}

export async function setUserPartnerBadgeVisibility(userId: string, showPartnerBadge: boolean) {
  const current = await getProfilePartnerFields(userId)
  if (!current?.isPartner) {
    throw new Error('Partner badge is not available for this account.')
  }

  const status: PartnerStatus = {
    isPartner: true,
    showPartnerBadge,
  }

  await writeStorePartnerStatus(userId, status)
  await writeProfilePartnerStatus(userId, status)

  return { userId, ...status }
}

export async function getProfilePartnerFields(userId: string): Promise<PartnerStatus | null> {
  const admin = getSupabaseAdminClient()

  const [profileResult, store] = await Promise.all([
    admin.from('profiles').select('is_partner, show_partner_badge').eq('user_id', userId).maybeSingle(),
    getStoreForUser(userId),
  ])

  const socialLinks = (store?.social_links as Record<string, string> | null) ?? null
  const profileColumnsAvailable = !isMissingPartnerColumnsError(profileResult.error?.message)

  if (!profileColumnsAvailable && !store) {
    return { isPartner: true, showPartnerBadge: true }
  }

  if (profileResult.error && !profileColumnsAvailable) {
    return partnerFromSocialLinks(socialLinks)
  }

  if (profileResult.error) throw profileResult.error

  if (profileColumnsAvailable && profileResult.data) {
    const fromProfile: PartnerStatus = {
      isPartner: profileResult.data.is_partner === true,
      showPartnerBadge: profileResult.data.show_partner_badge !== false,
    }
    if (fromProfile.isPartner || !store) return fromProfile
  }

  return partnerFromSocialLinks(socialLinks)
}

export async function getStorePartnerFields(
  ownerUserId: string | null,
  socialLinks: Record<string, string> | null | undefined,
): Promise<PartnerStatus> {
  if (!ownerUserId) {
    return partnerFromSocialLinks(socialLinks)
  }

  const admin = getSupabaseAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('is_partner, show_partner_badge')
    .eq('user_id', ownerUserId)
    .maybeSingle()

  if (isMissingPartnerColumnsError(error?.message)) {
    return partnerFromSocialLinks(socialLinks)
  }

  if (error) throw error

  if (profile) {
    const fromProfile: PartnerStatus = {
      isPartner: profile.is_partner === true,
      showPartnerBadge: profile.show_partner_badge !== false,
    }
    if (fromProfile.isPartner) return fromProfile
  }

  return partnerFromSocialLinks(socialLinks)
}
