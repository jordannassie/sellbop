import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getStorePartnerFields } from '@/lib/admin/partner'
import { mapMediaRow, withLegacyCoverMedia } from '@/lib/product-media/utils'

// GET /api/public/products/[slug] — publicly fetch a published product by slug
// Also supports ?sellerSlug=xxx to scope product lookup to a specific store
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const sellerSlug = url.searchParams.get('sellerSlug')

  const admin = getSupabaseAdminClient()

  // Select only columns guaranteed to exist in current production schema
  // Affiliate fields added conditionally below after 011 migration
  let productQuery = admin
    .from('products')
    .select(`
      id, title, slug, product_type, description, short_description,
      cover_image_url, image_url, price_cents, sale_enabled, sale_price_cents, sale_ends_at,
      is_live, access_message,
      created_at, store_id
    `)
    .eq('slug', slug)
    .eq('is_live', true)

  // If sellerSlug provided, scope to that store
  if (sellerSlug) {
    const { data: store } = await admin
      .from('stores')
      .select('id')
      .eq('slug', sellerSlug)
      .maybeSingle()
    if (!store) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    productQuery = productQuery.eq('store_id', store.id)
  }

  const { data: product, error } = await productQuery.maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  // Try to load affiliate fields (may not exist until migration 011 is applied)
  let affiliateEnabled = false
  let affiliateCommissionPercent: number | null = null
  try {
    const { data: pAffiliate } = await admin
      .from('products')
      .select('affiliate_enabled, affiliate_commission_percent')
      .eq('id', product.id)
      .maybeSingle()
    if (pAffiliate) {
      affiliateEnabled = (pAffiliate as Record<string, unknown>).affiliate_enabled as boolean ?? false
      affiliateCommissionPercent = (pAffiliate as Record<string, unknown>).affiliate_commission_percent as number | null ?? null
    }
  } catch { /* column doesn't exist yet — graceful */ }

  // Fetch seller/store info
  const { data: store } = await admin
    .from('stores')
    .select('id, slug, name, bio, avatar_url, owner_user_id, social_links')
    .eq('id', product.store_id)
    .maybeSingle()

  // Fallback avatar from profiles
  let avatarUrl = store?.avatar_url ?? null
  if (!avatarUrl && store?.owner_user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', store.owner_user_id)
      .maybeSingle()
    avatarUrl = profile?.avatar_url ?? null
  }

  // Sales count
  const { count: salesCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', product.id)
    .eq('payment_status', 'paid')

  let media: ReturnType<typeof mapMediaRow>[] = []
  try {
    const { data: mediaRows } = await admin
      .from('product_media')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true })
    media = withLegacyCoverMedia(
      (mediaRows ?? []).map(mapMediaRow),
      product.cover_image_url ?? product.image_url,
    )
  } catch {
    media = withLegacyCoverMedia([], product.cover_image_url ?? product.image_url)
  }

  let reviews: { customer_name: string; rating: number; message: string }[] = []
  try {
    const { data: reviewRows } = await admin
      .from('product_reviews')
      .select('customer_name, rating, message')
      .eq('product_id', product.id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(3)
    reviews = reviewRows ?? []
  } catch {
    // table may not exist yet
  }

  const socialLinksRaw =
    store?.social_links && typeof store.social_links === 'object'
      ? (store.social_links as Record<string, string>)
      : {}
  const partnerStatus = store
    ? await getStorePartnerFields(store.owner_user_id, socialLinksRaw)
    : { isPartner: false, showPartnerBadge: false }

  return NextResponse.json({
    product: {
      ...product,
      affiliate_enabled: affiliateEnabled,
      affiliate_commission_percent: affiliateCommissionPercent,
    },
    store: store
      ? {
          id: store.id,
          slug: store.slug,
          name: store.name,
          bio: store.bio,
          avatar_url: avatarUrl,
          is_partner: partnerStatus.isPartner,
          show_partner_badge: partnerStatus.showPartnerBadge,
        }
      : null,
    sales_count: salesCount ?? 0,
    media,
    reviews,
  })
}
