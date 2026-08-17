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

  // Select only columns guaranteed to exist in production schema
  const { data: store, error } = await admin
    .from('stores')
    .select('id, slug, name, headline, bio, avatar_url, owner_user_id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 404 })

  // Fallback: resolve creator avatar from profiles if store.avatar_url is null
  let avatarUrl = store.avatar_url
  if (!avatarUrl && store.owner_user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', store.owner_user_id)
      .maybeSingle()
    avatarUrl = profile?.avatar_url ?? null
  }

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

  return NextResponse.json({
    store: { ...store, avatar_url: avatarUrl },
    products: products ?? [],
  })
}
