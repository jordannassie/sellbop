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
      // Stripe briefly unreachable — seller can retry from payouts page
    }
  }

  return NextResponse.redirect(dashboardUrl)
}
