import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser, resolveAndVerifyProductOwnership } from '@/lib/supabase/v5-helpers'

// GET /api/v5/product-updates?slug=<slug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ updates: [] })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ updates: [], fallback: true })

  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!product) return NextResponse.json({ updates: [] })

  const { data: updates, error } = await admin
    .from('product_updates')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[V5 product-updates GET]', error.message)
    return NextResponse.json({ updates: [], error: error.message })
  }

  return NextResponse.json({ updates: updates ?? [] })
}

// POST /api/v5/product-updates
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    slug: string
    title: string
    body: string
    linkUrl?: string
    linkLabel?: string
    status?: 'draft' | 'published'
  }

  if (!body.slug || !body.title) {
    return NextResponse.json({ error: 'slug and title are required.' }, { status: 400 })
  }

  const resolved = await resolveAndVerifyProductOwnership(body.slug, user.id)
  if (!resolved) {
    return NextResponse.json({
      update: {
        id: `local-${crypto.randomUUID()}`,
        productId: body.slug,
        sellerId: user.id,
        title: body.title,
        body: body.body ?? '',
        linkUrl: body.linkUrl ?? null,
        linkLabel: body.linkLabel ?? null,
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      persisted: false,
    })
  }

  const admin = tryGetAdmin()!

  const { data: update, error } = await admin
    .from('product_updates')
    .insert({
      product_id: resolved.productId,
      seller_id: user.id,
      title: body.title,
      body: body.body ?? '',
      link_url: body.linkUrl ?? null,
      link_label: body.linkLabel ?? null,
      status: body.status ?? 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('[V5 product-updates POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ update, persisted: true })
}
