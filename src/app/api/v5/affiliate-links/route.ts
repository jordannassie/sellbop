import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser, resolveAndVerifyProductOwnership } from '@/lib/supabase/v5-helpers'

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// GET /api/v5/affiliate-links?slug=<slug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ links: [] })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ links: [], fallback: true })

  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!product) return NextResponse.json({ links: [] })

  const { data: links, error } = await admin
    .from('affiliate_links')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[V5 affiliate-links GET]', error.message)
    return NextResponse.json({ links: [], error: error.message })
  }

  return NextResponse.json({ links: links ?? [] })
}

// POST /api/v5/affiliate-links — create a new affiliate link for this product
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    slug: string
    affiliateName?: string
    affiliateEmail?: string
    commissionPct?: number
    affiliateCode?: string
  }

  if (!body.slug) {
    return NextResponse.json({ error: 'slug is required.' }, { status: 400 })
  }

  const code = body.affiliateCode ?? generateCode()

  const resolved = await resolveAndVerifyProductOwnership(body.slug, user.id)
  if (!resolved) {
    return NextResponse.json({
      link: {
        id: `local-${crypto.randomUUID()}`,
        productId: body.slug,
        sellerId: user.id,
        affiliateCode: code,
        affiliateName: body.affiliateName ?? null,
        affiliateEmail: body.affiliateEmail ?? null,
        commissionPct: body.commissionPct ?? 0,
        enabled: true,
        totalClicks: 0,
        totalOrders: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString(),
      },
      persisted: false,
    })
  }

  const admin = tryGetAdmin()!

  // Check for duplicate code
  const { data: existing } = await admin
    .from('affiliate_links')
    .select('id')
    .eq('product_id', resolved.productId)
    .eq('affiliate_code', code)
    .maybeSingle()

  const finalCode = existing ? generateCode(10) : code

  const { data: link, error } = await admin
    .from('affiliate_links')
    .insert({
      product_id: resolved.productId,
      seller_id: user.id,
      affiliate_code: finalCode,
      affiliate_name: body.affiliateName ?? null,
      affiliate_email: body.affiliateEmail ?? null,
      commission_pct: body.commissionPct ?? 0,
      enabled: true,
    })
    .select()
    .single()

  if (error) {
    console.error('[V5 affiliate-links POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ link, persisted: true })
}
