import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isMissingRelationError } from '@/lib/supabase/schema-compat'
import { getCurrentFinancialTerms } from '@/lib/partnerships/financial-terms'

export class PartnershipActivationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export interface LaunchChecklist {
  partnerClaimed: boolean
  revenueShareAccepted: boolean
  stripeConnected: boolean
  payoutsEnabled: boolean
  chargesEnabled: boolean
  hasLiveProduct: boolean
  canActivate: boolean
  blockers: string[]
}

export async function getLaunchChecklist(partnershipId: string): Promise<LaunchChecklist> {
  const admin = getSupabaseAdminClient()
  const { data: partnership } = await admin
    .from('store_partnerships')
    .select(`
      id, status, partner_user_id, claimed_at, current_financial_terms_id,
      stores ( id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_complete )
    `)
    .eq('id', partnershipId)
    .maybeSingle()

  if (!partnership) {
    throw new PartnershipActivationError('Partnership not found.', 404)
  }

  const store = partnership.stores as {
    id: string
    stripe_account_id: string | null
    stripe_charges_enabled: boolean
    stripe_payouts_enabled: boolean
    stripe_onboarding_complete: boolean
  } | null

  const terms = await getCurrentFinancialTerms(partnershipId)
  const revenueShareAccepted = !!(terms?.accepted_at)

  const { count: productCount } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store?.id ?? '')
    .eq('is_live', true)

  const partnerClaimed = partnership.status === 'claimed' || partnership.status === 'active'
  const stripeConnected = !!(store?.stripe_account_id && store?.stripe_onboarding_complete)
  const chargesEnabled = !!store?.stripe_charges_enabled
  const payoutsEnabled = !!store?.stripe_payouts_enabled
  const hasLiveProduct = (productCount ?? 0) > 0

  const blockers: string[] = []
  if (!partnership.partner_user_id) blockers.push('Partner has not claimed the Shop.')
  if (partnership.status !== 'claimed' && partnership.status !== 'active') {
    blockers.push(`Shop status must be claimed (current: ${partnership.status}).`)
  }
  if (!revenueShareAccepted) blockers.push('Partner has not accepted revenue share terms.')
  if (!stripeConnected) blockers.push('Stripe is not connected.')
  if (!chargesEnabled) blockers.push('Stripe charges are not enabled.')
  if (!payoutsEnabled) blockers.push('Stripe payouts are not enabled.')
  if (!hasLiveProduct) blockers.push('At least one live product is required.')

  return {
    partnerClaimed,
    revenueShareAccepted,
    stripeConnected,
    payoutsEnabled,
    chargesEnabled,
    hasLiveProduct,
    canActivate: blockers.length === 0,
    blockers,
  }
}

export async function activatePartnerShop(partnershipId: string, adminUserId: string) {
  const checklist = await getLaunchChecklist(partnershipId)
  if (!checklist.canActivate) {
    throw new PartnershipActivationError(checklist.blockers.join(' '), 400)
  }

  const admin = getSupabaseAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('store_partnerships')
    .update({
      status: 'active',
      activated_at: now,
      updated_at: now,
    })
    .eq('id', partnershipId)
    .in('status', ['claimed'])
    .select('*')
    .single()

  if (error || !data) {
    throw new PartnershipActivationError('Could not activate Shop. It may already be active.', 400)
  }

  return data
}

export async function isActivePartnerStore(storeId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('store_partnerships')
    .select('status')
    .eq('store_id', storeId)
    .maybeSingle()
  return data?.status === 'active'
}

export async function getActivePartnerContext(storeId: string) {
  const admin = getSupabaseAdminClient()
  const { data: partnership } = await admin
    .from('store_partnerships')
    .select('id, status, partner_user_id, current_financial_terms_id')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  if (!partnership) return null

  const terms = partnership.current_financial_terms_id
    ? await getCurrentFinancialTerms(partnership.id)
    : null

  if (!terms?.accepted_at) return null

  return { partnership, terms }
}
