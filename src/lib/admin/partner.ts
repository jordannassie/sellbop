import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function setUserPartnerStatus(userId: string, isPartner: boolean) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update({
      is_partner: isPartner,
      show_partner_badge: isPartner ? true : false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('user_id, is_partner, show_partner_badge')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('User not found')

  return {
    userId: data.user_id,
    isPartner: data.is_partner === true,
    showPartnerBadge: data.show_partner_badge !== false,
  }
}

export async function getProfilePartnerFields(userId: string) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('is_partner, show_partner_badge')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    isPartner: data.is_partner === true,
    showPartnerBadge: data.show_partner_badge !== false,
  }
}
