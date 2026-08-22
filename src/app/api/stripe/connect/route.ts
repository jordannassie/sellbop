import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { env } from '@/lib/env'
import { requireActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'

// POST /api/stripe/connect — begin Stripe Connect onboarding for the active shop
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

  let store
  try {
    store = await requireActiveStoreForUser(user.id)
  } catch (err) {
    if (err instanceof ActiveStoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const stripe = new Stripe(env.stripe.secretKey)
  const admin = getSupabaseAdminClient()

  let accountId = store.stripe_account_id

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email,
      dashboard: 'express',
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
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
    })
    accountId = account.id

    await admin.from('stores')
      .update({ stripe_account_id: accountId })
      .eq('id', store.id)
  }

  const accountLink = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: `${env.app.url}/api/stripe/connect/refresh?storeId=${store.id}`,
        return_url: `${env.app.url}/api/stripe/connect/return?storeId=${store.id}`,
      },
    },
  })

  return NextResponse.json({ onboarding_url: accountLink.url })
}

// GET /api/stripe/connect — return Stripe account status for the active shop
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ connected: false, stripe_required: true })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const store = await requireActiveStoreForUser(user.id)
    return NextResponse.json({
      connected: !!(store.stripe_account_id && store.stripe_charges_enabled),
      stripe_account_id: store.stripe_account_id ?? null,
      onboarding_complete: store.stripe_onboarding_complete ?? false,
      charges_enabled: store.stripe_charges_enabled ?? false,
      payouts_enabled: store.stripe_payouts_enabled ?? false,
    })
  } catch (err) {
    if (err instanceof ActiveStoreError) {
      return NextResponse.json({ connected: false })
    }
    throw err
  }
}
