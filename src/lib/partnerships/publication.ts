import 'server-only'

import type { PartnershipStatus } from './constants'

export interface StorePartnershipRow {
  id: string
  store_id: string
  status: PartnershipStatus
  partner_user_id: string | null
  partner_name: string | null
  partner_email: string | null
}

/** Normal shops (no partnership row) behave as today. */
export function canPubliclyViewStore(partnership: StorePartnershipRow | null): boolean {
  if (!partnership) return true
  return partnership.status === 'active'
}

export function canStoreAcceptCheckout(partnership: StorePartnershipRow | null): boolean {
  if (!partnership) return true
  return partnership.status === 'active'
}

export function isPartnerShopUnpublished(partnership: StorePartnershipRow | null): boolean {
  if (!partnership) return false
  return partnership.status !== 'active'
}

export function partnershipAllowsPreviewLink(partnership: StorePartnershipRow | null): boolean {
  if (!partnership) return false
  return ['draft', 'preview', 'invited', 'claimed'].includes(partnership.status)
}
