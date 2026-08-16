import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ products: [] })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const category = url.searchParams.get('category')?.trim() ?? ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '48'), 96)

  const admin = getSupabaseAdminClient()

  let dbQuery = admin
    .from('products')
    .select(`
      id, title, slug, short_description, description,
      cover_image_url, image_url, price_cents, category,
      affiliate_enabled, affiliate_commission_percent,
      created_at,
      stores!inner(id, name, slug, avatar_url)
    `)
    .eq('is_live', true)
    .eq('marketplace_listing', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'All') {
    dbQuery = dbQuery.eq('category', category)
  }

  if (query) {
    // Supabase full-text or ilike fallback
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`
    )
  }

  const { data, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const products = (data ?? []).map((p: Record<string, unknown>) => {
    const store = p.stores as { id: string; name: string; slug: string; avatar_url: string | null } | null
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.short_description ?? null,
      coverImage: p.cover_image_url ?? p.image_url ?? null,
      priceCents: p.price_cents ?? 0,
      category: p.category ?? null,
      affiliateEnabled: p.affiliate_enabled ?? false,
      affiliateCommissionPercent: p.affiliate_commission_percent ?? null,
      createdAt: p.created_at,
      storeName: store?.name ?? null,
      storeSlug: store?.slug ?? null,
      storeAvatarUrl: store?.avatar_url ?? null,
    }
  })

  return NextResponse.json({ products })
}
