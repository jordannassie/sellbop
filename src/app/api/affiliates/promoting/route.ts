import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'

/**
 * GET /api/affiliates/promoting
 * Returns all affiliate relationships + stats for the authenticated user.
 */
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ items: [] })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ items: [] }, { status: 401 })

  const admin = getSupabaseAdminClient()

  // Get all active relationships for this affiliate
  const { data: relationships } = await admin
    .from('affiliate_relationships')
    .select('*')
    .eq('affiliate_user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (!relationships?.length) return NextResponse.json({ items: [] })

  const productIds = relationships.map(r => r.product_id)

  // Load products + stores
  const [{ data: products }, { data: clicks }, { data: commissions }] = await Promise.all([
    admin
      .from('products')
      .select('id, title, slug, cover_image_url, image_url, price_cents, affiliate_commission_percent, affiliate_enabled')
      .in('id', productIds),
    admin
      .from('affiliate_clicks')
      .select('relationship_id')
      .eq('affiliate_user_id', user.id),
    admin
      .from('affiliate_commissions')
      .select('relationship_id, commission_cents, status')
      .eq('affiliate_user_id', user.id),
  ])

  const productById = new Map((products ?? []).map(p => [p.id, p]))
  const clicksByRelId = new Map<string, number>()
  for (const c of clicks ?? []) {
    clicksByRelId.set(c.relationship_id, (clicksByRelId.get(c.relationship_id) ?? 0) + 1)
  }
  const commsByRelId = new Map<string, { sales: number; earned: number }>()
  for (const c of commissions ?? []) {
    const cur = commsByRelId.get(c.relationship_id) ?? { sales: 0, earned: 0 }
    commsByRelId.set(c.relationship_id, {
      sales: cur.sales + 1,
      earned: cur.earned + (c.status !== 'reversed' ? c.commission_cents : 0),
    })
  }

  const appUrl = env.app.url

  const items = relationships.map(rel => {
    const product = productById.get(rel.product_id)
    const clicks = clicksByRelId.get(rel.id) ?? 0
    const stats = commsByRelId.get(rel.id) ?? { sales: 0, earned: 0 }
    const priceCents = product?.price_cents ?? 0
    const commPercent = product?.affiliate_commission_percent ?? 0
    const commCents = Math.floor(priceCents * (commPercent / 100))
    const affiliateUrl = `${appUrl}/p/${product?.slug ?? ''}?ref=${rel.referral_code}`

    return {
      relationshipId: rel.id,
      referralCode: rel.referral_code,
      productId: rel.product_id,
      productTitle: product?.title ?? 'Product',
      productSlug: product?.slug ?? null,
      coverImage: product?.cover_image_url ?? product?.image_url ?? null,
      priceCents,
      commissionPercent: commPercent,
      commissionPerSaleCents: commCents,
      affiliateUrl,
      clicks,
      sales: stats.sales,
      earnedCents: stats.earned,
      affiliateEnabled: product?.affiliate_enabled ?? false,
      source: rel.source,
      createdAt: rel.created_at,
    }
  })

  return NextResponse.json({ items })
}
