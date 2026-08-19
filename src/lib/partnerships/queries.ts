import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isMissingRelationError } from '@/lib/supabase/schema-errors'
import type { Database } from '@/lib/supabase/types'
import type { PartnershipStatus } from './constants'
import type { StorePartnershipRow } from './publication'

export type { StorePartnershipRow }

export interface PartnershipSummary {
  id: string
  storeId: string
  storeName: string
  storeSlug: string
  status: PartnershipStatus
  partnerName: string | null
  partnerEmail: string | null
  partnerUserId: string | null
  productCount: number
  stripeConnected: boolean
  createdAt: string
  claimedAt: string | null
}

type PartnershipRow = Database['public']['Tables']['store_partnerships']['Row']
type StoreSummary = Pick<
  Database['public']['Tables']['stores']['Row'],
  'id' | 'name' | 'slug' | 'avatar_url' | 'banner_url' | 'stripe_account_id' | 'stripe_charges_enabled' | 'stripe_onboarding_complete'
>

export async function getPartnershipByStoreId(storeId: string): Promise<StorePartnershipRow | null> {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('store_partnerships')
    .select('id, store_id, status, partner_user_id, partner_name, partner_email')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error && !isMissingRelationError(error)) throw error
  if (!data) return null
  return {
    ...data,
    status: data.status as PartnershipStatus,
  }
}

export async function getPartnershipMapForStores(storeIds: string[]) {
  if (storeIds.length === 0) return new Map<string, { id: string; status: PartnershipStatus }>()
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('store_partnerships')
    .select('id, store_id, status')
    .in('store_id', storeIds)

  if (error) {
    if (isMissingRelationError(error)) return new Map()
    throw error
  }

  return new Map((data ?? []).map(row => [row.store_id, { id: row.id, status: row.status as PartnershipStatus }]))
}

export async function listAdminPartnerships(): Promise<PartnershipSummary[]> {
  const admin = getSupabaseAdminClient()
  const { data: partnerships, error } = await admin
    .from('store_partnerships')
    .select(`
      id, store_id, status, partner_name, partner_email, partner_user_id,
      created_at, claimed_at,
      stores ( id, name, slug, stripe_account_id, stripe_charges_enabled )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  const storeIds = (partnerships ?? []).map(p => p.store_id)
  const productCounts = new Map<string, number>()
  if (storeIds.length > 0) {
    const { data: products } = await admin.from('products').select('store_id').in('store_id', storeIds)
    for (const p of products ?? []) {
      productCounts.set(p.store_id, (productCounts.get(p.store_id) ?? 0) + 1)
    }
  }

  return (partnerships ?? []).map(row => {
    const store = row.stores as {
      id: string
      name: string
      slug: string
      stripe_account_id: string | null
      stripe_charges_enabled: boolean
    } | null
    return {
      id: row.id,
      storeId: row.store_id,
      storeName: store?.name ?? 'Shop',
      storeSlug: store?.slug ?? '',
      status: row.status as PartnershipStatus,
      partnerName: row.partner_name,
      partnerEmail: row.partner_email,
      partnerUserId: row.partner_user_id,
      productCount: productCounts.get(row.store_id) ?? 0,
      stripeConnected: !!(store?.stripe_account_id && store?.stripe_charges_enabled),
      createdAt: row.created_at,
      claimedAt: row.claimed_at,
    }
  })
}

export async function getPartnershipDetail(partnershipId: string) {
  const admin = getSupabaseAdminClient()
  const { data: partnership, error } = await admin
    .from('store_partnerships')
    .select(`
      *,
      stores ( id, name, slug, avatar_url, banner_url, stripe_account_id, stripe_charges_enabled, stripe_onboarding_complete )
    `)
    .eq('id', partnershipId)
    .maybeSingle()

  if (error) throw error
  if (!partnership) return null

  const typedPartnership = partnership as PartnershipRow & { stores: StoreSummary | null }

  const [{ count: productCount }, inviteResult, previewResult] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }).eq('store_id', typedPartnership.store_id),
    admin
      .from('partner_shop_invites')
      .select('*')
      .eq('partnership_id', partnershipId)
      .order('created_at', { ascending: false })
      .limit(1),
    admin
      .from('partner_shop_preview_tokens')
      .select('*')
      .eq('partnership_id', partnershipId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return {
    partnership: typedPartnership,
    store: typedPartnership.stores,
    productCount: productCount ?? 0,
    latestInvite: inviteResult.data?.[0] ?? null,
    activePreviewToken: previewResult.data?.[0] ?? null,
  }
}
