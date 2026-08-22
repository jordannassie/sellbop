import 'server-only'

import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

export interface StripeAccountStatus {
    chargesEnabled: boolean
    payoutsEnabled: boolean
    onboardingComplete: boolean
    currentlyDue: string[]
}

/**
 * Single source of truth for what "connected" means for a SellBop seller's
 * Stripe account. Always re-retrieves the account from Stripe rather than
 * trusting embedded fields on a webhook payload, so it gives the same answer
 * no matter which code path (onboarding return, status check, webhook) calls
 * it and regardless of whether the event that triggered the call happens to
 * be shaped for the v1 Accounts API or the v2 Accounts API we create
 * accounts with (`stripe.v2.core.accounts.create`, `dashboard: 'express'`,
 * `configuration.recipient`).
 *
 * Returns null if Stripe isn't configured or the retrieve fails -- callers
 * should treat null as "couldn't determine status right now", not as
 * "disconnected". The account_id itself is never touched here; only the
 * seller-visible status flags are recomputed.
 */
export async function fetchStripeAccountStatus(accountId: string): Promise<StripeAccountStatus | null> {
    if (!env.stripe.secretKey) return null

  try {
        const stripe = new Stripe(env.stripe.secretKey)
        const account = await stripe.v2.core.accounts.retrieve(accountId, {
                include: ['configuration.recipient', 'requirements'],
        })

      const capabilities = account.configuration?.recipient?.capabilities?.stripe_balance
        const chargesEnabled = capabilities?.stripe_transfers?.status === 'active'
        const payoutsEnabled = capabilities?.payouts?.status === 'active'

      // Requirements are best-effort context for diagnostics/UI copy -- if the
      // shape isn't what we expect, don't let that break the core sync.
      let currentlyDue: string[] = []
            try {
                    const raw = (account as unknown as { requirements?: { currently_due?: unknown } }).requirements?.currently_due
                    if (Array.isArray(raw)) currentlyDue = raw.filter((v): v is string => typeof v === 'string')
            } catch {
                    currentlyDue = []
            }

      return {
              chargesEnabled,
              payoutsEnabled,
              // "Onboarding complete" means the seller has nothing further to do on
              // our end -- i.e. charges are actually active, not just that they
              // clicked through the Stripe onboarding form. A seller can finish the
              // Stripe-hosted form while Stripe is still verifying in the
              // background, in which case charges_enabled is still false and we
              // must keep showing a pending state rather than "complete".
              onboardingComplete: chargesEnabled,
              currentlyDue,
      }
  } catch (err) {
        console.error('[stripe-connect-sync] failed to retrieve account', accountId, err instanceof Error ? err.message : err)
        return null
  }
}

/**
 * Fetches the live status from Stripe and persists it to the store row.
 * Never touches stripe_account_id -- this only ever updates the derived
 * status flags for an account that's already linked to the store.
 */
export async function syncStoreStripeStatus(storeId: string, accountId: string): Promise<StripeAccountStatus | null> {
    const status = await fetchStripeAccountStatus(accountId)
    if (!status) return null

  const admin = getSupabaseAdminClient()
    const { error } = await admin.from('stores')
      .update({
              stripe_charges_enabled: status.chargesEnabled,
              stripe_payouts_enabled: status.payoutsEnabled,
              stripe_onboarding_complete: status.onboardingComplete,
      })
      .eq('id', storeId)

  if (error) {
        console.error('[stripe-connect-sync] failed to persist status', storeId, accountId, error.message)
        return null
  }

  return status
}
