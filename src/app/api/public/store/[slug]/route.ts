import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'

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

  // Core store query — only columns guaranteed in production schema
  const { data: store, error } = await admin
    .from('stores')
    .select('id, slug, name, headline, bio, avatar_url, owner_user_id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 404 })

  // Fallback: resolve avatar from profiles if store.avatar_url is null
  let avatarUrl = store.avatar_url
  if (!avatarUrl && store.owner_user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', store.owner_user_id)
      .maybeSingle()
    avatarUrl = profile?.avatar_url ?? null
  }

  // Try to load banner_url (added in migration 011)
  let bannerUrl: string | null = null
  try {
    const { data: extra } = await admin
      .from('stores')
      .select('banner_url')
      .eq('id', store.id)
      .maybeSingle()
    if (extra) bannerUrl = (extra as Record<string, unknown>).banner_url as string | null ?? null
  } catch { /* column not yet in production — ignore */ }

  // Load products — core fields only
  const { data: rawProducts } = await admin
    .from('products')
    .select(`
      id, title, slug, product_type, short_description,
      cover_image_url, image_url, price_cents, is_live, created_at
    `)
    .eq('store_id', store.id)
    .eq('is_live', true)
    .is('external_source', null)
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

  return NextResponse.json({
    store: { ...store, avatar_url: avatarUrl, banner_url: bannerUrl },
    products: enrichedProducts,
    hasAffiliateProducts,
  })
}
