import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { generateReferralCode } from '@/lib/affiliates'

/**
 * POST /api/affiliates/join
 * Body: { productId: string }
 *
 * Creates (or retrieves) an affiliate relationship for the authenticated user.
 * Returns the relationship including the referral code.
 *
 * Self-referral protection: sellers cannot become affiliates of their own products.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: { productId?: string }
  try { body = await request.json() } catch { body = {} }

  const productId = body.productId?.trim()
  if (!productId) return NextResponse.json({ error: 'productId is required.' }, { status: 400 })

  const admin = getSupabaseAdminClient()

  // Load product + store
  const { data: product } = await admin
    .from('products')
    .select('id, store_id, title, price_cents, is_live, affiliate_enabled, affiliate_commission_percent')
    .eq('id', productId)
    .maybeSingle()

  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (!product.is_live) return NextResponse.json({ error: 'Product is not available.' }, { status: 400 })
  if (!product.affiliate_enabled) return NextResponse.json({ error: 'This product does not have Sellbop Share enabled.' }, { status: 400 })

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 500 })

  // Self-referral protection
  if (store.owner_user_id === user.id) {
    return NextResponse.json({ error: 'You cannot become an affiliate of your own product.' }, { status: 400 })
  }

  // Return existing relationship
  const { data: existing } = await admin
    .from('affiliate_relationships')
    .select('*')
    .eq('affiliate_user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ relationship: existing })
  }

  // Create new relationship with unique referral code
  let referralCode = generateReferralCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: codeCheck } = await admin
      .from('affiliate_relationships')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle()
    if (!codeCheck) break
    referralCode = generateReferralCode()
    attempts++
  }

  const { data: relationship, error } = await admin
    .from('affiliate_relationships')
    .insert({
      affiliate_user_id: user.id,
      product_id: productId,
      seller_id: store.owner_user_id,
      referral_code: referralCode,
      source: 'manual_join',
      status: 'active',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ relationship }, { status: 201 })
}

/**
 * GET /api/affiliates/join?productId=xxx
 * Returns existing affiliate relationship (if any) for authenticated user + product.
 */
export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ relationship: null })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ relationship: null })

  const productId = new URL(request.url).searchParams.get('productId')
  if (!productId) return NextResponse.json({ relationship: null })

  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('affiliate_relationships')
    .select('*')
    .eq('affiliate_user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  return NextResponse.json({ relationship: data ?? null })
}
