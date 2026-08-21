import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getCategoryFilterValues, normalizeProductCategory } from '@/lib/product-categories'
import { getPartnershipMapForStores } from '@/lib/partnerships/queries'
import { isMissingSchemaError } from '@/lib/supabase/schema-compat'
import type { PartnershipStatus } from '@/lib/partnerships/constants'
import { canPubliclyViewStore } from '@/lib/partnerships/publication'

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
      cover_image_url, image_url, price_cents, sale_enabled, sale_price_cents, sale_ends_at, category,
      affiliate_enabled, affiliate_commission_percent,
      created_at,
      stores!inner(id, name, slug, avatar_url, marketplace_enabled)
    `)
    .eq('is_live', true)
    .eq('marketplace_listing', true)
    .eq('stores.marketplace_enabled', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'All') {
    dbQuery = dbQuery.in('category', getCategoryFilterValues(category))
  }

  if (query) {
    // Supabase full-text or ilike fallback
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`
    )
  }

  const { data, error } = await dbQuery

  if (error) {
    const columnMissing = error.message?.includes('marketplace_enabled')
    if (columnMissing) {
      let legacyQuery = admin
        .from('products')
        .select(`
          id, title, slug, short_description, description,
          cover_image_url, image_url, price_cents, sale_enabled, sale_price_cents, sale_ends_at, category,
          affiliate_enabled, affiliate_commission_percent,
          created_at,
          stores!inner(id, name, slug, avatar_url)
        `)
        .eq('is_live', true)
        .eq('marketplace_listing', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category && category !== 'All') {
        legacyQuery = legacyQuery.in('category', getCategoryFilterValues(category))
      }
      if (query) {
        legacyQuery = legacyQuery.or(
          `title.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`,
        )
      }

      const legacy = await legacyQuery
      if (legacy.error) {
        if (isMissingSchemaError(legacy.error) || legacy.error.message?.includes('column')) {
          return NextResponse.json({ products: [], migrationRequired: true })
        }
        console.error('[GET /api/marketplace]', legacy.error.message)
        return NextResponse.json({ error: legacy.error.message }, { status: 500 })
      }

      const legacyStoreIds = [...new Set((legacy.data ?? []).map((p: Record<string, unknown>) => {
        const store = p.stores as { id: string } | null
        return store?.id
      }).filter(Boolean) as string[])]

      let legacyPartnershipMap = new Map<string, { id: string; status: PartnershipStatus }>()
      try {
        legacyPartnershipMap = await getPartnershipMapForStores(legacyStoreIds)
      } catch (partnershipErr) {
        console.error('[GET /api/marketplace] partnership lookup failed:', partnershipErr)
        return NextResponse.json({ error: 'Could not load marketplace listings.' }, { status: 500 })
      }

      const legacyFiltered = (legacy.data ?? []).filter((p: Record<string, unknown>) => {
        const store = p.stores as { id: string } | null
        if (!store) return false
        const partnership = legacyPartnershipMap.get(store.id)
        return canPubliclyViewStore(partnership ? { id: partnership.id, store_id: store.id, status: partnership.status, partner_user_id: null, partner_name: null, partner_email: null } : null)
      })

      const legacyProducts = legacyFiltered.map((p: Record<string, unknown>) => {
        const store = p.stores as { id: string; name: string; slug: string; avatar_url: string | null } | null
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          shortDescription: p.short_description ?? null,
          coverImage: p.cover_image_url ?? p.image_url ?? null,
          priceCents: p.price_cents ?? 0,
          saleEnabled: p.sale_enabled ?? false,
          salePriceCents: p.sale_price_cents ?? null,
          saleEndsAt: p.sale_ends_at ?? null,
          category: normalizeProductCategory(p.category as string | null),
          affiliateEnabled: p.affiliate_enabled ?? false,
          affiliateCommissionPercent: p.affiliate_commission_percent ?? null,
          createdAt: p.created_at,
          storeName: store?.name ?? null,
          storeSlug: store?.slug ?? null,
          storeAvatarUrl: store?.avatar_url ?? null,
        }
      })

      return NextResponse.json({ products: legacyProducts, migrationRequired: true })
    }

    if (isMissingSchemaError(error) || error.message?.includes('column')) {
      return NextResponse.json({ products: [], migrationRequired: true })
    }
    console.error('[GET /api/marketplace]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const storeIds = [...new Set((data ?? []).map((p: Record<string, unknown>) => {
    const store = p.stores as { id: string } | null
    return store?.id
  }).filter(Boolean) as string[])]

  let partnershipMap = new Map<string, { id: string; status: PartnershipStatus }>()
  try {
    partnershipMap = await getPartnershipMapForStores(storeIds)
  } catch (partnershipErr) {
    console.error('[GET /api/marketplace] partnership lookup failed:', partnershipErr)
    return NextResponse.json({ error: 'Could not load marketplace listings.' }, { status: 500 })
  }

  const filtered = (data ?? []).filter((p: Record<string, unknown>) => {
    const store = p.stores as { id: string } | null
    if (!store) return false
    const partnership = partnershipMap.get(store.id)
    return canPubliclyViewStore(partnership ? { id: partnership.id, store_id: store.id, status: partnership.status, partner_user_id: null, partner_name: null, partner_email: null } : null)
  })

  const products = filtered.map((p: Record<string, unknown>) => {
    const store = p.stores as { id: string; name: string; slug: string; avatar_url: string | null } | null
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.short_description ?? null,
      coverImage: p.cover_image_url ?? p.image_url ?? null,
      priceCents: p.price_cents ?? 0,
      saleEnabled: p.sale_enabled ?? false,
      salePriceCents: p.sale_price_cents ?? null,
      saleEndsAt: p.sale_ends_at ?? null,
      category: normalizeProductCategory(p.category as string | null),
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
