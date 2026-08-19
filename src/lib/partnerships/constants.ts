export const PARTNERSHIP_STATUSES = [
  'draft',
  'preview',
  'invited',
  'claimed',
  'active',
  'paused',
  'declined',
  'archived',
] as const

export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number]

export function isPartnershipStatus(value: string): value is PartnershipStatus {
  return (PARTNERSHIP_STATUSES as readonly string[]).includes(value)
}

export const INVITE_EXPIRY_DAYS = 7
export const PREVIEW_EXPIRY_DAYS = 30
