import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'

// GET /api/public/products/[slug] — publicly fetch a published product
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = getSupabaseAdminClient()

  const { data: product, error } = await admin
    .from('products')
    .select(`
      id, title, slug, product_type, description, short_description,
      cover_image_url, image_url, price_cents, is_live, access_message,
      affiliate_enabled, affiliate_commission_percent,
      created_at, store_id
    `)
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  // Fetch seller/store info
  const { data: store } = await admin
    .from('stores')
    .select('id, slug, name, bio, avatar_url, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  // Sales count
  const { count: salesCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', product.id)
    .eq('payment_status', 'paid')

  return NextResponse.json({
    product,
    store,
    sales_count: salesCount ?? 0,
  })
}
