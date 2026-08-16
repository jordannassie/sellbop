import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'

/**
 * GET /api/affiliates/network
 * Returns affiliate network stats for the authenticated seller's products.
 */
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ products: [], affiliates: [] })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ products: [], affiliates: [] }, { status: 401 })

  const admin = getSupabaseAdminClient()

  // Get all affiliate relationships for products owned by this user
  const { data: relationships } = await admin
    .from('affiliate_relationships')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (!relationships?.length) {
    return NextResponse.json({ products: [], affiliates: [], totalAffiliates: 0 })
  }

  const relationshipIds = relationships.map(r => r.id)
  const productIds = [...new Set(relationships.map(r => r.product_id))]

  const [{ data: products }, { data: clicks }, { data: commissions }, { data: profiles }] = await Promise.all([
    admin
      .from('products')
      .select('id, title, slug, cover_image_url, image_url, price_cents, affiliate_enabled, affiliate_commission_percent')
      .in('id', productIds),
    admin
      .from('affiliate_clicks')
      .select('relationship_id')
      .eq('seller_id', user.id),
    admin
      .from('affiliate_commissions')
      .select('relationship_id, affiliate_user_id, commission_cents, status, gross_sale_cents')
      .eq('seller_id', user.id),
    admin
      .from('profiles')
      .select('user_id, email, full_name, avatar_url')
      .in('user_id', relationships.map(r => r.affiliate_user_id)),
  ])

  const productById = new Map((products ?? []).map(p => [p.id, p]))
  const profileByUserId = new Map((profiles ?? []).map(p => [p.user_id, p]))

  // Clicks per relationship
  const clicksByRelId = new Map<string, number>()
  for (const c of clicks ?? []) {
    clicksByRelId.set(c.relationship_id, (clicksByRelId.get(c.relationship_id) ?? 0) + 1)
  }

  // Sales + commissions per relationship
  const statsByRelId = new Map<string, { sales: number; commCents: number; revenueCents: number }>()
  for (const c of commissions ?? []) {
    const cur = statsByRelId.get(c.relationship_id) ?? { sales: 0, commCents: 0, revenueCents: 0 }
    statsByRelId.set(c.relationship_id, {
      sales: cur.sales + 1,
      commCents: cur.commCents + (c.status !== 'reversed' ? c.commission_cents : 0),
      revenueCents: cur.revenueCents + (c.status !== 'reversed' ? c.gross_sale_cents : 0),
    })
  }

  // Affiliates leaderboard
  const affiliateItems = relationships
    .filter(r => r.status === 'active')
    .map(rel => {
      const profile = profileByUserId.get(rel.affiliate_user_id)
      const stats = statsByRelId.get(rel.id) ?? { sales: 0, commCents: 0, revenueCents: 0 }
      const totalClicks = clicksByRelId.get(rel.id) ?? 0
      const product = productById.get(rel.product_id)
      return {
        relationshipId: rel.id,
        affiliateUserId: rel.affiliate_user_id,
        affiliateName: profile?.full_name ?? profile?.email?.split('@')[0] ?? 'Affiliate',
        affiliateEmail: profile?.email ?? null,
        affiliateAvatar: profile?.avatar_url ?? null,
        productId: rel.product_id,
        productTitle: product?.title ?? 'Product',
        referralCode: rel.referral_code,
        source: rel.source,
        clicks: totalClicks,
        sales: stats.sales,
        commissionEarnedCents: stats.commCents,
        revenueGeneratedCents: stats.revenueCents,
        joinedAt: rel.created_at,
      }
    })
    .sort((a, b) => b.revenueGeneratedCents - a.revenueGeneratedCents)

  // Per-product stats
  const productStats = productIds.map(productId => {
    const product = productById.get(productId)
    const rels = relationships.filter(r => r.product_id === productId && r.status === 'active')
    const totalClicks = rels.reduce((sum, r) => sum + (clicksByRelId.get(r.id) ?? 0), 0)
    const totalStats = rels.reduce((acc, r) => {
      const s = statsByRelId.get(r.id) ?? { sales: 0, commCents: 0, revenueCents: 0 }
      return { sales: acc.sales + s.sales, commCents: acc.commCents + s.commCents, revenueCents: acc.revenueCents + s.revenueCents }
    }, { sales: 0, commCents: 0, revenueCents: 0 })

    return {
      productId,
      productTitle: product?.title ?? 'Product',
      productSlug: product?.slug ?? null,
      coverImage: product?.cover_image_url ?? product?.image_url ?? null,
      affiliateCount: rels.length,
      affiliateEnabled: product?.affiliate_enabled ?? false,
      commissionPercent: product?.affiliate_commission_percent ?? 0,
      clicks: totalClicks,
      sales: totalStats.sales,
      revenueCents: totalStats.revenueCents,
      commissionsCents: totalStats.commCents,
    }
  })

  return NextResponse.json({
    products: productStats,
    affiliates: affiliateItems,
    totalAffiliates: relationships.filter(r => r.status === 'active').length,
  })
}
