import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { validatePreviewToken } from '@/lib/partnerships/service'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { stripPartnerSocialLinks } from '@/lib/partner-storage'
import { resolveStoreBannerUrl } from '@/lib/store-defaults'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  const { token } = await params
  const preview = await validatePreviewToken(token)
  if (!preview) return NextResponse.json({ error: 'Preview link invalid or expired.' }, { status: 404 })

  const partnership = preview.store_partnerships as {
    stores: {
      id: string
      slug: string
      name: string
      headline: string | null
      bio: string | null
      avatar_url: string | null
      banner_url: string | null
      social_links: Record<string, string> | null
    }
  } | null

  const store = partnership?.stores
  if (!store) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })

  const admin = getSupabaseAdminClient()
  const { data: products } = await admin
    .from('products')
    .select('id, title, slug, short_description, cover_image_url, image_url, price_cents, sale_enabled, sale_price_cents, sale_ends_at, affiliate_enabled, affiliate_commission_percent')
    .eq('store_id', store.id)
    .eq('is_live', true)
    .order('sort_order', { ascending: true })

  return NextResponse.json({
    preview: true,
    store: {
      ...store,
      banner_url: resolveStoreBannerUrl(store.banner_url),
      social_links: stripPartnerSocialLinks(store.social_links ?? {}),
    },
    products: products ?? [],
  })
}
