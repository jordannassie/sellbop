import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isMissingRelationError } from '@/lib/supabase/schema-compat'
import { DEFAULT_PARTNER_SHARE_BPS, validatePartnerShareBps } from '@/lib/payments/partner-allocation'

export class PartnershipTermsError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export interface FinancialTermsRow {
  id: string
  partnership_id: string
  version: number
  partner_share_bps: number
  financial_model: string
  split_basis: string
  accepted_at: string | null
  accepted_by_user_id: string | null
}

export async function getCurrentFinancialTerms(partnershipId: string): Promise<FinancialTermsRow | null> {
  const admin = getSupabaseAdminClient()
  const { data: partnership } = await admin
    .from('store_partnerships')
    .select('current_financial_terms_id')
    .eq('id', partnershipId)
    .maybeSingle()

  if (!partnership?.current_financial_terms_id) return null

  const { data: terms, error } = await admin
    .from('partnership_financial_terms')
    .select('*')
    .eq('id', partnership.current_financial_terms_id)
    .maybeSingle()

  if (error && isMissingRelationError(error)) return null
  if (error) throw error

  return terms as FinancialTermsRow | null
}

export async function createInitialFinancialTerms(partnershipId: string, adminUserId: string, partnerShareBps = DEFAULT_PARTNER_SHARE_BPS) {
  const admin = getSupabaseAdminClient()
  if (!validatePartnerShareBps(partnerShareBps)) {
    throw new PartnershipTermsError('Invalid partner share percentage.')
  }

  const { data: terms, error } = await admin
    .from('partnership_financial_terms')
    .insert({
      partnership_id: partnershipId,
      version: 1,
      partner_share_bps: partnerShareBps,
      financial_model: 'net_split_v1',
      split_basis: 'after_affiliate_and_processing',
      created_by_user_id: adminUserId,
    })
    .select('*')
    .single()

  if (error) throw error

  await admin.from('store_partnerships').update({
    current_financial_terms_id: terms.id,
    updated_at: new Date().toISOString(),
  }).eq('id', partnershipId)

  return terms as FinancialTermsRow
}

export async function createNewFinancialTermsVersion(input: {
  partnershipId: string
  adminUserId: string
  partnerShareBps: number
}) {
  if (!validatePartnerShareBps(input.partnerShareBps)) {
    throw new PartnershipTermsError('Invalid partner share percentage.')
  }

  const admin = getSupabaseAdminClient()
  const { data: latest } = await admin
    .from('partnership_financial_terms')
    .select('version')
    .eq('partnership_id', input.partnershipId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version ?? 0) + 1

  await admin
    .from('partnership_financial_terms')
    .update({ superseded_at: new Date().toISOString() })
    .eq('partnership_id', input.partnershipId)
    .is('superseded_at', null)
    .neq('version', nextVersion)

  const { data: terms, error } = await admin
    .from('partnership_financial_terms')
    .insert({
      partnership_id: input.partnershipId,
      version: nextVersion,
      partner_share_bps: input.partnerShareBps,
      financial_model: 'net_split_v1',
      split_basis: 'after_affiliate_and_processing',
      created_by_user_id: input.adminUserId,
    })
    .select('*')
    .single()

  if (error) throw error

  await admin.from('store_partnerships').update({
    current_financial_terms_id: terms.id,
    updated_at: new Date().toISOString(),
  }).eq('id', input.partnershipId)

  return terms as FinancialTermsRow
}

export async function acceptFinancialTerms(input: {
  partnershipId: string
  userId: string
  termsId?: string
}) {
  const admin = getSupabaseAdminClient()
  const { data: partnership } = await admin
    .from('store_partnerships')
    .select('id, partner_user_id, current_financial_terms_id, status')
    .eq('id', input.partnershipId)
    .maybeSingle()

  if (!partnership) throw new PartnershipTermsError('Partnership not found.', 404)
  if (partnership.partner_user_id !== input.userId) {
    throw new PartnershipTermsError('Only the Partner can accept revenue share terms.', 403)
  }

  const termsId = input.termsId ?? partnership.current_financial_terms_id
  if (!termsId) throw new PartnershipTermsError('No revenue share terms configured.', 400)

  const { data: terms, error } = await admin
    .from('partnership_financial_terms')
    .update({
      accepted_by_user_id: input.userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', termsId)
    .eq('partnership_id', input.partnershipId)
    .is('accepted_at', null)
    .select('*')
    .single()

  if (error || !terms) throw new PartnershipTermsError('Could not accept terms.', 400)
  return terms as FinancialTermsRow
}

export async function listFinancialTermsVersions(partnershipId: string) {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('partnership_financial_terms')
    .select('*')
    .eq('partnership_id', partnershipId)
    .order('version', { ascending: false })
  return (data ?? []) as FinancialTermsRow[]
}
