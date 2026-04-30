import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin } from '@/lib/supabase/v5-helpers'

// POST /api/v5/affiliate-click — public, no auth required
// Body: { affiliateCode: string; productSlug: string; referrerUrl?: string }
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    affiliateCode: string
    productSlug: string
    referrerUrl?: string
  }

  if (!body.affiliateCode || !body.productSlug) {
    return NextResponse.json({ tracked: false })
  }

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ tracked: false, fallback: true })

  // Look up affiliate link
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', body.productSlug)
    .maybeSingle()

  if (!product) return NextResponse.json({ tracked: false })

  const { data: affLink } = await admin
    .from('affiliate_links')
    .select('id')
    .eq('product_id', product.id)
    .eq('affiliate_code', body.affiliateCode)
    .eq('enabled', true)
    .maybeSingle()

  if (!affLink) return NextResponse.json({ tracked: false })

  // Insert click record
  const { error: clickError } = await admin
    .from('affiliate_clicks')
    .insert({
      affiliate_link_id: affLink.id,
      product_id: product.id,
      affiliate_code: body.affiliateCode,
      referrer_url: body.referrerUrl ?? null,
    })

  if (clickError) {
    console.error('[V5 affiliate-click POST]', clickError.message)
    return NextResponse.json({ tracked: false })
  }

  // Counter update is best-effort — a Postgres function can be added later
  // to atomically increment total_clicks on the affiliate_links row.

  return NextResponse.json({ tracked: true })
}
