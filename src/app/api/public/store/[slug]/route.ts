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

  const { data: store, error } = await admin
    .from('stores')
    .select('id, slug, name, headline, bio, avatar_url, banner_url')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 404 })

  const { data: products } = await admin
    .from('products')
    .select(`
      id, title, slug, product_type, short_description,
      cover_image_url, image_url, price_cents, is_live, created_at
    `)
    .eq('store_id', store.id)
    .eq('is_live', true)
    .is('external_source', null)
    .order('created_at', { ascending: false })

  return NextResponse.json({ store, products: products ?? [] })
}
