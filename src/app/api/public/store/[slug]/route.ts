import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { stripPartnerSocialLinks, partnerFromSocialLinks } from '@/lib/partner-storage'
import { resolveStoreBannerUrl } from '@/lib/store-defaults'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { canPubliclyViewStore } from '@/lib/partnerships/publication'

// GET /api/public/store/[slug] — publicly fetch a store and its live products
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = getSupabaseAdminClient()

  // Single comprehensive query — includes banner_url and social_links
  const { data: store, error } = await admin
    .from('stores')
    .select('id, slug, name, headline, bio, avatar_url, banner_url, value_video_url, social_links')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 404 })

  const partnership = await getPartnershipByStoreId(store.id)
  if (!canPubliclyViewStore(partnership)) {
    return NextResponse.json({ error: 'Store not found.' }, { status: 404 })
  }

  const rawSl = (store as Record<string, unknown>).social_links
  const socialLinksRaw: Record<string, string> =
    rawSl && typeof rawSl === 'object' ? rawSl as Record<string, string> : {}

  const partnerStatus = partnerFromSocialLinks(socialLinksRaw)
  const socialLinks = stripPartnerSocialLinks(socialLinksRaw)

  const bannerUrl = resolveStoreBannerUrl(
    (store as Record<string, unknown>).banner_url as string | null | undefined,
  )

  // Load products — core fields only
  const { data: rawProducts } = await admin
    .from('products')
    .select(`
      id, title, slug, product_type, short_description,
      cover_image_url, image_url, price_cents, sale_enabled, sale_price_cents, sale_ends_at, is_live, created_at
    `)
    .eq('store_id', store.id)
    .eq('is_live', true)
    .is('external_source', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const products = rawProducts ?? []

  // Try to enrich with affiliate data (added in migration 010/011)
  let affiliateMap: Record<string, { affiliate_enabled: boolean; affiliate_commission_percent: number | null }> = {}
  if (products.length > 0) {
    try {
      const ids = products.map(p => p.id)
      const { data: affData } = await admin
        .from('products')
        .select('id, affiliate_enabled, affiliate_commission_percent')
        .in('id', ids)
      if (affData) {
        for (const row of affData) {
          affiliateMap[row.id] = {
            affiliate_enabled: (row as Record<string, unknown>).affiliate_enabled as boolean ?? false,
            affiliate_commission_percent: (row as Record<string, unknown>).affiliate_commission_percent as number | null ?? null,
          }
        }
      }
    } catch { /* migration pending — products have no affiliate fields yet */ }
  }

  const enrichedProducts = products.map(p => ({
    ...p,
    affiliate_enabled: affiliateMap[p.id]?.affiliate_enabled ?? false,
    affiliate_commission_percent: affiliateMap[p.id]?.affiliate_commission_percent ?? null,
  }))

  const hasAffiliateProducts = enrichedProducts.some(p => p.affiliate_enabled && (p.price_cents ?? 0) > 0)

  return NextResponse.json(
    {
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        headline: store.headline,
        bio: store.bio,
        avatar_url: store.avatar_url,
        banner_url: bannerUrl,
        value_video_url: (store as Record<string, unknown>).value_video_url as string | null | undefined ?? null,
        social_links: socialLinks,
        is_partner: partnerStatus.isPartner,
        show_partner_badge: partnerStatus.showPartnerBadge,
      },
      products: enrichedProducts,
      hasAffiliateProducts,
    },
    {
      headers: {
        // Never serve a stale store object from Netlify/CDN/browser cache —
        // banner_url and other fields must always reflect the live DB row.
        'Cache-Control': 'no-store, must-revalidate',
      },
    },
  )
}
