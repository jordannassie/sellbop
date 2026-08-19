import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { slugify } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import {
  normalizeSaleFieldsForSave,
  validateSalePricingForSave,
} from '@/lib/pricing/product-price'
import { mapMediaRow, withLegacyCoverMedia } from '@/lib/product-media/utils'

import { verifyProductManageAccess } from '@/lib/stores/product-access'

// GET /api/products/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductManageAccess(id, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  // Load product files
  const { data: files } = await admin
    .from('product_files')
    .select('*')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  // Load sales count
  const { count: salesCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id)
    .eq('payment_status', 'paid')

  let media = withLegacyCoverMedia([], product?.cover_image_url ?? product?.image_url)
  try {
    const { data: mediaRows } = await admin
      .from('product_media')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })
    media = withLegacyCoverMedia(
      (mediaRows ?? []).map(mapMediaRow),
      product?.cover_image_url ?? product?.image_url,
    )
  } catch {
    // migration pending
  }

  return NextResponse.json({ product, files: files ?? [], sales_count: salesCount ?? 0, media })
}

// PATCH /api/products/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductManageAccess(id, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const body = await request.json()
  const admin = getSupabaseAdminClient()

  // If slug is being changed, ensure uniqueness
  let slug = body.slug ? slugify(body.slug) : undefined
  if (slug) {
    const storeId = ownership.product.store_id
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await admin
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()
      if (!existing) break
      slug = `${slugify(body.slug)}-${i}`
    }
    body.slug = slug
  }

  // Build a typed update object
  type ProductUpdate = Database['public']['Tables']['products']['Update']
  const update: ProductUpdate = { updated_at: new Date().toISOString() }
  if ('title' in body) update.title = body.title as string
  if ('slug' in body) update.slug = body.slug as string
  if ('description' in body) update.description = body.description as string | null
  if ('short_description' in body) update.short_description = body.short_description as string | null
  if ('price_cents' in body) update.price_cents = body.price_cents as number | null
  if ('cover_image_url' in body) update.cover_image_url = body.cover_image_url as string | null
  if ('image_url' in body) update.image_url = body.image_url as string | null
  if ('is_live' in body) update.is_live = body.is_live as boolean
  if ('access_message' in body) update.access_message = body.access_message as string | null
  if ('checkout_copy' in body) update.checkout_copy = body.checkout_copy as string | null
  if ('category' in body) update.category = body.category as string | null
  if ('marketplace_listing' in body) update.marketplace_listing = body.marketplace_listing as boolean
  if ('sort_order' in body) update.sort_order = body.sort_order as number
  if ('affiliate_enabled' in body) {
    update.affiliate_enabled = body.affiliate_enabled as boolean
    update.affiliate_updated_at = new Date().toISOString()
  }
  if ('affiliate_commission_percent' in body) {
    update.affiliate_commission_percent = body.affiliate_commission_percent as number | null
  }

  const nextPriceCents =
    'price_cents' in body ? (body.price_cents as number | null) ?? 0 : undefined
  const hasSalePatch =
    'sale_enabled' in body ||
    'sale_price_cents' in body ||
    'sale_ends_at' in body ||
    nextPriceCents !== undefined

  if (hasSalePatch) {
    const { data: current } = await admin
      .from('products')
      .select('price_cents, sale_enabled, sale_price_cents, sale_ends_at')
      .eq('id', id)
      .single()

    const priceCents = nextPriceCents ?? current?.price_cents ?? 0
    const saleFields = normalizeSaleFieldsForSave({
      price_cents: priceCents,
      sale_enabled:
        'sale_enabled' in body ? (body.sale_enabled as boolean) : (current?.sale_enabled ?? false),
      sale_price_cents:
        'sale_price_cents' in body
          ? (body.sale_price_cents as number | null)
          : (current?.sale_price_cents ?? null),
      sale_ends_at:
        'sale_ends_at' in body
          ? (body.sale_ends_at as string | null)
          : (current?.sale_ends_at ?? null),
    })

    const saleError = validateSalePricingForSave({
      price_cents: priceCents,
      sale_enabled: saleFields.sale_enabled,
      sale_price_cents: saleFields.sale_price_cents,
    })
    if (saleError) return NextResponse.json({ error: saleError }, { status: 400 })

    update.sale_enabled = saleFields.sale_enabled
    update.sale_price_cents = saleFields.sale_price_cents
    update.sale_ends_at = saleFields.sale_ends_at
  }

  const { data: product, error } = await admin
    .from('products')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ product })
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductManageAccess(id, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
