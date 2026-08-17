import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

// GET /api/stripe/connect/return — seller lands here after finishing (or
// leaving) Stripe's onboarding flow. Refresh their account status from
// Stripe before sending them back to the payouts page.
//
// Reads the v2 Account's `recipient` configuration capability statuses:
// - stripe_balance.stripe_transfers: can this account receive transfers
//   from the platform? (gates whether checkout allows a purchase)
// - stripe_balance.payouts: can Stripe pay out their balance to their bank?
// We reuse the existing `stores.stripe_charges_enabled` / `stripe_payouts_enabled`
// columns to store these (no schema change needed) — for a recipient-only
// account "charges_enabled" means "can receive transfers".
export async function GET(request: NextRequest) {
  const dashboardUrl = new URL('/dashboard/payouts', request.url)

  if (!isSupabaseAdminConfigured() || !env.stripe.secretKey) {
    return NextResponse.redirect(dashboardUrl)
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id, stripe_account_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (store?.stripe_account_id) {
    try {
      const stripe = new Stripe(env.stripe.secretKey)
      const account = await stripe.v2.core.accounts.retrieve(store.stripe_account_id, {
        include: ['configuration.recipient'],
      })

      const capabilities = account.configuration?.recipient?.capabilities?.stripe_balance
      const transfersActive = capabilities?.stripe_transfers?.status === 'active'
      const payoutsActive = capabilities?.payouts?.status === 'active'

      await admin.from('stores')
        .update({
          stripe_charges_enabled: transfersActive,
          stripe_payouts_enabled: payoutsActive,
          stripe_onboarding_complete: transfersActive,
        })
        .eq('id', store.id)
    } catch {
      // If Stripe is briefly unreachable, don't block the redirect on it —
      // the seller can retry from the payouts page.
    }
  }

  return NextResponse.redirect(dashboardUrl)
}
