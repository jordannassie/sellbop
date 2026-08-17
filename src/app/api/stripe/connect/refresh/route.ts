import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

// GET /api/stripe/connect/refresh — the onboarding link Stripe generated
// expired (they're only valid for a few minutes) or the seller navigated
// away and back. Generate a fresh account link and send them right back
// into onboarding.
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

  if (!store?.stripe_account_id) {
    return NextResponse.redirect(dashboardUrl)
  }

  try {
    const stripe = new Stripe(env.stripe.secretKey)
    const accountLink = await stripe.accountLinks.create({
      account: store.stripe_account_id,
      refresh_url: `${env.app.url}/api/stripe/connect/refresh`,
      return_url: `${env.app.url}/api/stripe/connect/return`,
      type: 'account_onboarding',
    })
    return NextResponse.redirect(accountLink.url)
  } catch {
    return NextResponse.redirect(dashboardUrl)
  }
}
