import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin } from '@/lib/supabase/v5-helpers'

// GET /api/v5/public-reviews?slug=<slug>
// Public endpoint — returns only approved reviews for a product
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
    .select('id, customer_name, rating, message, created_at')
    .eq('product_id', product.id)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[V5 public-reviews GET]', error.message)
    return NextResponse.json({ reviews: [] })
  }

  return NextResponse.json({ reviews: reviews ?? [] })
}
