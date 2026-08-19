import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { env, isSupabaseAdminConfigured } from '@/lib/env'
import { userCanManageStore } from '@/lib/stores/active-store'

export async function GET(request: NextRequest) {
  const dashboardUrl = new URL('/dashboard/payouts', request.url)

  if (!isSupabaseAdminConfigured() || !env.stripe.secretKey) {
    return NextResponse.redirect(dashboardUrl)
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const storeId = request.nextUrl.searchParams.get('storeId')
  if (!storeId) return NextResponse.redirect(dashboardUrl)

  const canManage = await userCanManageStore(user.id, storeId)
  if (!canManage) return NextResponse.redirect(dashboardUrl)

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id, stripe_account_id')
    .eq('id', storeId)
    .maybeSingle()

  if (!store?.stripe_account_id) {
    return NextResponse.redirect(dashboardUrl)
  }

  try {
    const stripe = new Stripe(env.stripe.secretKey)
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: store.stripe_account_id,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: `${env.app.url}/api/stripe/connect/refresh?storeId=${store.id}`,
          return_url: `${env.app.url}/api/stripe/connect/return?storeId=${store.id}`,
        },
      },
    })
    return NextResponse.redirect(accountLink.url)
  } catch {
    return NextResponse.redirect(dashboardUrl)
  }
}
