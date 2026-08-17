import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

// GET /api/stripe/connect/return — seller lands here after finishing (or
// leaving) Stripe's onboarding flow. Refresh their account status from
// Stripe before sending them back to the payouts page.
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
      const account = await stripe.accounts.retrieve(store.stripe_account_id)

      await admin.from('stores')
        .update({
          stripe_charges_enabled: !!account.charges_enabled,
          stripe_payouts_enabled: !!account.payouts_enabled,
          stripe_onboarding_complete: !!(account.details_submitted && account.charges_enabled),
        })
        .eq('id', store.id)
    } catch {
      // If Stripe is briefly unreachable, the account.updated webhook will
      // catch this up shortly — don't block the redirect on it.
    }
  }

  return NextResponse.redirect(dashboardUrl)
}
