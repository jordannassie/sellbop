import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'

/**
 * POST /api/affiliates/click
 * Body: { referralCode: string; landingUrl?: string }
 *
 * Records an affiliate click. Server-side only.
 * No financial effect — clicks are analytics only.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true })
  }

  let body: { referralCode?: string; landingUrl?: string }
  try { body = await request.json() } catch { body = {} }

  const referralCode = body.referralCode?.trim().toUpperCase()
  if (!referralCode) return NextResponse.json({ ok: true })

  const admin = getSupabaseAdminClient()

  // Validate referral code
  const { data: rel } = await admin
    .from('affiliate_relationships')
    .select('id, affiliate_user_id, product_id, seller_id, referral_code, status')
    .eq('referral_code', referralCode)
    .eq('status', 'active')
    .maybeSingle()

  if (!rel) return NextResponse.json({ ok: true })

  // Verify product still has affiliate_enabled
  const { data: product } = await admin
    .from('products')
    .select('is_live, affiliate_enabled')
    .eq('id', rel.product_id)
    .maybeSingle()

  if (!product?.is_live || !product?.affiliate_enabled) {
    return NextResponse.json({ ok: true })
  }

  // Record click (fire and forget — best effort)
  await admin.from('affiliate_clicks').insert({
    relationship_id: rel.id,
    affiliate_user_id: rel.affiliate_user_id,
    product_id: rel.product_id,
    seller_id: rel.seller_id,
    referral_code: rel.referral_code,
    landing_url: body.landingUrl ?? null,
  })

  return NextResponse.json({ ok: true })
}
