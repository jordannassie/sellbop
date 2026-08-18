import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { paginate, type AdminPaginationParams } from '@/lib/admin/helpers'

export interface AdminAffiliateSummary {
  relationshipId: string
  affiliateUserId: string
  affiliateEmail: string | null
  affiliateName: string | null
  sellerUserId: string
  sellerName: string | null
  productId: string
  productTitle: string
  referralCode: string
  commissionPercent: number | null
  status: string
  clickCount: number
  orderCount: number
  commissionEarnedCents: number
  createdAt: string
}

export async function getAdminAffiliates(options?: AdminPaginationParams) {
  const admin = getSupabaseAdminClient()
  const [relationshipsResult, commissionsResult, clicksResult, productsResult, profilesResult] = await Promise.all([
    admin.from('affiliate_relationships').select('*').order('created_at', { ascending: false }),
    admin.from('affiliate_commissions').select('relationship_id, commission_cents, status, order_id'),
    admin.from('affiliate_clicks').select('relationship_id'),
    admin.from('products').select('id, title, affiliate_commission_percent'),
    admin.from('profiles').select('user_id, email, full_name'),
  ])

  if (relationshipsResult.error) throw relationshipsResult.error
  if (commissionsResult.error) throw commissionsResult.error
  if (clicksResult.error) throw clicksResult.error
  if (productsResult.error) throw productsResult.error
  if (profilesResult.error) throw profilesResult.error

  const productById = new Map((productsResult.data ?? []).map((p) => [p.id, p]))
  const profileById = new Map((profilesResult.data ?? []).map((p) => [p.user_id, p]))
  const clicksByRel = new Map<string, number>()
  const orderCountByRel = new Map<string, number>()
  const earnedByRel = new Map<string, number>()

  for (const click of clicksResult.data ?? []) {
    clicksByRel.set(click.relationship_id, (clicksByRel.get(click.relationship_id) ?? 0) + 1)
  }

  for (const commission of commissionsResult.data ?? []) {
    if (commission.status === 'reversed') continue
    orderCountByRel.set(commission.relationship_id, (orderCountByRel.get(commission.relationship_id) ?? 0) + 1)
    earnedByRel.set(
      commission.relationship_id,
      (earnedByRel.get(commission.relationship_id) ?? 0) + commission.commission_cents,
    )
  }

  let affiliates: AdminAffiliateSummary[] = (relationshipsResult.data ?? []).map((rel) => {
    const product = productById.get(rel.product_id)
    const affiliateProfile = profileById.get(rel.affiliate_user_id)
    const sellerProfile = profileById.get(rel.seller_id)
    return {
      relationshipId: rel.id,
      affiliateUserId: rel.affiliate_user_id,
      affiliateEmail: affiliateProfile?.email ?? null,
      affiliateName: affiliateProfile?.full_name ?? null,
      sellerUserId: rel.seller_id,
      sellerName: sellerProfile?.full_name ?? null,
      productId: rel.product_id,
      productTitle: product?.title ?? 'Product',
      referralCode: rel.referral_code,
      commissionPercent: product?.affiliate_commission_percent ?? null,
      status: rel.status,
      clickCount: clicksByRel.get(rel.id) ?? 0,
      orderCount: orderCountByRel.get(rel.id) ?? 0,
      commissionEarnedCents: earnedByRel.get(rel.id) ?? 0,
      createdAt: rel.created_at,
    }
  })

  if (options?.q) {
    const needle = options.q.toLowerCase()
    affiliates = affiliates.filter((a) =>
      (a.affiliateEmail?.toLowerCase().includes(needle) ?? false)
      || (a.affiliateName?.toLowerCase().includes(needle) ?? false)
      || a.productTitle.toLowerCase().includes(needle)
      || a.referralCode.toLowerCase().includes(needle),
    )
  }

  if (options?.filter === 'active') affiliates = affiliates.filter((a) => a.status === 'active')
  if (options?.filter === 'inactive') affiliates = affiliates.filter((a) => a.status !== 'active')

  if (!options) return { affiliates, ...paginate(affiliates, 1, affiliates.length || 1) }
  const paged = paginate(affiliates, options.page, options.pageSize)
  return { affiliates: paged.items, ...paged }
}

export async function getAdminAffiliateById(relationshipId: string) {
  const { affiliates } = await getAdminAffiliates()
  return affiliates.find((a) => a.relationshipId === relationshipId) ?? null
}
