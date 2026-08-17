import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { parseVideoLink } from '@/lib/product-media/video-url'
import {
  loadProductMedia,
  syncCoverImageFromMedia,
  migrateLegacyCoverToMedia,
} from '@/lib/product-media/server'
import { mapMediaRow, withLegacyCoverMedia } from '@/lib/product-media/utils'

async function verifyProductOwnership(productId: string, userId: string) {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('id, store_id, cover_image_url')
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

// GET /api/products/[id]/media
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ media: [] })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  try {
    const media = await loadProductMedia(productId)
    return NextResponse.json({
      media: withLegacyCoverMedia(media, ownership.product.cover_image_url),
    })
  } catch {
    return NextResponse.json({
      media: withLegacyCoverMedia([], ownership.product.cover_image_url),
      migrationRequired: true,
    })
  }
}

// POST /api/products/[id]/media — add one media item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  let body: {
    media_type: 'image' | 'video_link'
    url: string
    thumbnail_url?: string | null
    provider?: string
    storage_path?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  try {
    await migrateLegacyCoverToMedia(
      productId,
      user.id,
      ownership.product.cover_image_url,
    )
  } catch {
    // table may not exist yet
  }

  let insertRow: {
    product_id: string
    seller_id: string
    media_type: string
    url: string
    thumbnail_url: string | null
    provider: string
    storage_path: string | null
    sort_order?: number
  }

  if (body.media_type === 'video_link') {
    const parsed = parseVideoLink(body.url)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Please enter a valid YouTube, Loom, Vimeo, or Wistia link.' },
        { status: 400 },
      )
    }
    insertRow = {
      product_id: productId,
      seller_id: user.id,
      media_type: 'video_link',
      url: parsed.url,
      thumbnail_url: parsed.thumbnailUrl,
      provider: parsed.provider,
      storage_path: null,
    }
  } else if (body.media_type === 'image') {
    if (!body.url?.trim()) {
      return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 })
    }
    insertRow = {
      product_id: productId,
      seller_id: user.id,
      media_type: 'image',
      url: body.url.trim(),
      thumbnail_url: body.thumbnail_url ?? body.url.trim(),
      provider: 'upload',
      storage_path: body.storage_path ?? null,
    }
  } else {
    return NextResponse.json({ error: 'Invalid media type.' }, { status: 400 })
  }

  const { data: existing } = await admin
    .from('product_media')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort =
    ((existing?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1
  insertRow.sort_order = nextSort

  const { data: row, error } = await admin
    .from('product_media')
    .insert(insertRow)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await syncCoverImageFromMedia(productId)

  return NextResponse.json({ media: mapMediaRow(row) }, { status: 201 })
}

// PATCH /api/products/[id]/media — reorder { order: string[] }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  let body: { order: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!Array.isArray(body.order)) {
    return NextResponse.json({ error: 'order array is required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  await Promise.all(
    body.order.map((mediaId, index) =>
      admin
        .from('product_media')
        .update({ sort_order: index })
        .eq('id', mediaId)
        .eq('product_id', productId)
        .eq('seller_id', user.id),
    ),
  )

  await syncCoverImageFromMedia(productId)
  const media = await loadProductMedia(productId)

  return NextResponse.json({ media })
}

// DELETE /api/products/[id]/media?mediaId=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get('mediaId')
  if (!mediaId || mediaId === 'legacy-cover') {
    return NextResponse.json({ error: 'mediaId required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('product_media')
    .delete()
    .eq('id', mediaId)
    .eq('product_id', productId)
    .eq('seller_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncCoverImageFromMedia(productId)
  const media = await loadProductMedia(productId)

  return NextResponse.json({
    media: withLegacyCoverMedia(media, ownership.product.cover_image_url),
  })
}
