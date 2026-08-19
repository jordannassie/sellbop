export type StoreMemberRole = 'owner' | 'admin' | 'manager'

export type UserStoreSummary = {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  banner_url: string | null
  owner_user_id: string
  role: StoreMemberRole
  isPartnerShop?: boolean
  partnershipStatus?: string | null
  isOwnedShop?: boolean
}
