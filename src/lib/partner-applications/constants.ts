export const PARTNER_APPLICATION_STATUSES = [
  'new',
  'contacted',
  'reviewing',
  'approved',
  'declined',
] as const

export type PartnerApplicationStatus = (typeof PARTNER_APPLICATION_STATUSES)[number]

export const PARTNER_APPLICATION_STATUS_LABELS: Record<PartnerApplicationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  reviewing: 'Reviewing',
  approved: 'Approved',
  declined: 'Declined',
}

export const AUDIENCE_SIZE_OPTIONS = [
  'Under 5K',
  '5K – 25K',
  '25K – 100K',
  '100K – 500K',
  '500K – 1M',
  '1M+',
] as const

export type AudienceSizeOption = (typeof AUDIENCE_SIZE_OPTIONS)[number]

export function isPartnerApplicationStatus(value: string): value is PartnerApplicationStatus {
  return (PARTNER_APPLICATION_STATUSES as readonly string[]).includes(value)
}

export function isAudienceSizeOption(value: string): value is AudienceSizeOption {
  return (AUDIENCE_SIZE_OPTIONS as readonly string[]).includes(value)
}
