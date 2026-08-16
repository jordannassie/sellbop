import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { slugify } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'

async function getSellerStore(userId: string) {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('owner_user_id', userId)
    .maybeSingle()
  return data
}

async function verifyProductOwnership(productId: string, userId: string) {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('id, store_id')
    .eq('id', productId)
    .maybeSingle()
  if (!product) return null

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store || store.owner_user_id !== userId) return null
  return { product, store }
}

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

  const ownership = await verifyProductOwnership(id, user.id)
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

  return NextResponse.json({ product, files: files ?? [], sales_count: salesCount ?? 0 })
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

  const ownership = await verifyProductOwnership(id, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const body = await request.json()
  const admin = getSupabaseAdminClient()

  // If slug is being changed, ensure uniqueness
  let slug = body.slug ? slugify(body.slug) : undefined
  if (slug) {
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await admin
        .from('products')
        .select('id')
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
  if ('affiliate_enabled' in body) {
    update.affiliate_enabled = body.affiliate_enabled as boolean
    update.affiliate_updated_at = new Date().toISOString()
  }
  if ('affiliate_commission_percent' in body) {
    update.affiliate_commission_percent = body.affiliate_commission_percent as number | null
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

  const ownership = await verifyProductOwnership(id, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
