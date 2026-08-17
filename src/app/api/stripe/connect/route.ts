import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'

// POST /api/stripe/connect — begin Stripe Connect onboarding for a seller
export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  if (!env.stripe.secretKey) {
    return NextResponse.json({
      stripe_required: true,
      message: 'Stripe Connect is not yet configured. See STRIPE-INTEGRATION-HANDOFF.md.',
    }, { status: 503 })
  }

  const stripe = new Stripe(env.stripe.secretKey)
  const admin = getSupabaseAdminClient()

  const { data: store } = await admin
    .from('stores')
    .select('id, stripe_account_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) {
    return NextResponse.json({ error: 'No store found for this account.' }, { status: 404 })
  }

  let accountId = store.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: { transfers: { requested: true } },
    })
    accountId = account.id

    await admin.from('stores')
      .update({ stripe_account_id: accountId })
      .eq('owner_user_id', user.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${env.app.url}/api/stripe/connect/refresh`,
    return_url: `${env.app.url}/api/stripe/connect/return`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ onboarding_url: accountLink.url })
}

// GET /api/stripe/connect — return Stripe account status
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ connected: false, stripe_required: true })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    connected: !!(store?.stripe_account_id && store?.stripe_charges_enabled),
    stripe_account_id: store?.stripe_account_id ?? null,
    onboarding_complete: store?.stripe_onboarding_complete ?? false,
    charges_enabled: store?.stripe_charges_enabled ?? false,
    payouts_enabled: store?.stripe_payouts_enabled ?? false,
  })
}
