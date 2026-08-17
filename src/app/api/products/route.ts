import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { slugify } from '@/lib/utils'

// GET /api/products — list the authenticated seller's products
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()

  // Find the seller's store
  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) return NextResponse.json({ products: [] })

  const { data: products, error } = await admin
    .from('products')
    .select(`
      id, title, slug, product_type, description, short_description,
      cover_image_url, image_url, price_cents, is_live, sort_order,
      marketplace_listing, affiliate_enabled, affiliate_commission_percent,
      created_at, updated_at, store_id
    `)
    .eq('store_id', store.id)
    .is('external_source', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach sales count from orders
  const productIds = (products ?? []).map(p => p.id)
  let salesMap: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: salesData } = await admin
      .from('orders')
      .select('product_id')
      .eq('payment_status', 'paid')
      .in('product_id', productIds)

    for (const row of salesData ?? []) {
      if (row.product_id) {
        salesMap[row.product_id] = (salesMap[row.product_id] ?? 0) + 1
      }
    }
  }

  const enriched = (products ?? []).map(p => ({
    ...p,
    sales_count: salesMap[p.id] ?? 0,
  }))

  return NextResponse.json({ products: enriched })
}

// POST /api/products — create a new product
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json()
  const {
    title, description, short_description, price_cents, cover_image_url, slug: rawSlug, is_live,
    category, marketplace_listing, affiliate_enabled, affiliate_commission_percent,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Product title is required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  // Find or create the seller's store
  let { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) {
    const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Creator'
    const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
    const { data: newStore } = await admin
      .from('stores')
      .insert({ owner_user_id: user.id, slug: baseSlug, name: displayName })
      .select('id')
      .single()
    store = newStore
  }

  if (!store) {
    return NextResponse.json({ error: 'Could not create seller store.' }, { status: 500 })
  }

  // New products are placed first in manual display order.
  const { data: topRow } = await admin
    .from('products')
    .select('sort_order')
    .eq('store_id', store.id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  const nextSortOrder = (topRow?.sort_order ?? 1) - 1

  // Generate a unique slug
  const baseSlug = rawSlug?.trim() ? slugify(rawSlug) : slugify(title)
  let slug = baseSlug
  for (let i = 1; i <= 10; i++) {
    const { data: existing } = await admin
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${i}`
  }

  const { data: product, error } = await admin
    .from('products')
    .insert({
      store_id: store.id,
      title: title.trim(),
      slug,
      product_type: 'digital_download',
      description: description?.trim() ?? null,
      short_description: short_description?.trim() ?? null,
      price_cents: price_cents ?? 0,
      cover_image_url: cover_image_url ?? null,
      is_live: is_live ?? false,
      category: category ?? null,
      sort_order: nextSortOrder,
      // Default ON: every new product is Marketplace-listed and affiliate-enabled at 30%
      marketplace_listing: marketplace_listing ?? true,
      affiliate_enabled: affiliate_enabled ?? true,
      affiliate_commission_percent: (affiliate_enabled ?? true) ? (affiliate_commission_percent ?? 30) : null,
      affiliate_updated_at: (affiliate_enabled ?? true) ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ product }, { status: 201 })
}
