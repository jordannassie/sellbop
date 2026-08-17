import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'

// POST /api/stripe/connect — begin Stripe Connect onboarding for a seller
//
// Uses the Accounts v2 API. This platform account was created after Stripe
// stopped recommending the v1 Accounts API (stripe.accounts.create) for new
// connected accounts — v1 creation now fails with "Stripe no longer
// recommends Accounts v1 for new connected accounts." The v2 equivalent for
// a seller who only needs to *receive* payouts (not accept charges directly)
// is the `recipient` configuration, paired with a v2 Account Link for
// hosted onboarding. See https://docs.stripe.com/connect/accounts-v2/migrate-integration
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
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email,
      dashboard: 'none',
      identity: { country: 'US' },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      defaults: {
        // Stripe monitors risk and is responsible for negative balances on
        // this recipient account (Stripe-managed risk). Required whenever a
        // recipient requests the stripe_transfers capability.
        responsibilities: {
          fees_collector: 'stripe',
          losses_collector: 'stripe',
        },
      },
    })
    accountId = account.id

    await admin.from('stores')
      .update({ stripe_account_id: accountId })
      .eq('owner_user_id', user.id)
  }

  const accountLink = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: `${env.app.url}/api/stripe/connect/refresh`,
        return_url: `${env.app.url}/api/stripe/connect/return`,
      },
    },
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
