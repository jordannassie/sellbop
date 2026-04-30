import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser, resolveAndVerifyProductOwnership } from '@/lib/supabase/v5-helpers'

// GET /api/v5/product-reviews?slug=<slug>  — seller sees all reviews for product
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ reviews: [] })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ reviews: [], fallback: true })

  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!product) return NextResponse.json({ reviews: [] })

  const { data: reviews, error } = await admin
    .from('product_reviews')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[V5 product-reviews GET]', error.message)
    return NextResponse.json({ reviews: [], error: error.message })
  }

  return NextResponse.json({ reviews: reviews ?? [] })
}

// POST /api/v5/product-reviews — seller adds manual review/testimonial
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    slug: string
    customerName: string
    customerEmail?: string
    rating: number
    message: string
    approved?: boolean
  }

  if (!body.slug || !body.customerName || !body.rating) {
    return NextResponse.json({ error: 'slug, customerName, and rating are required.' }, { status: 400 })
  }

  const resolved = await resolveAndVerifyProductOwnership(body.slug, user.id)
  if (!resolved) {
    return NextResponse.json({
      review: {
        id: `local-${crypto.randomUUID()}`,
        productId: body.slug,
        sellerId: user.id,
        customerName: body.customerName,
        customerEmail: body.customerEmail ?? null,
        rating: body.rating,
        message: body.message ?? '',
        approved: body.approved ?? false,
        createdAt: new Date().toISOString(),
      },
      persisted: false,
    })
  }

  const admin = tryGetAdmin()!

  const { data: review, error } = await admin
    .from('product_reviews')
    .insert({
      product_id: resolved.productId,
      seller_id: user.id,
      customer_name: body.customerName,
      customer_email: body.customerEmail ?? null,
      rating: Math.min(5, Math.max(1, body.rating)),
      message: body.message ?? '',
      approved: body.approved ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('[V5 product-reviews POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review, persisted: true })
}
