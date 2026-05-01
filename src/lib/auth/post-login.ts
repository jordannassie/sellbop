import 'server-only'

import { getAllowedAdminEmails } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { AccountSummary, AuthSession } from '@/lib/domain/auth'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isAllowedAdminEmail(email: string) {
  return getAllowedAdminEmails().includes(normalizeEmail(email))
}

export async function upsertProfile(session: AuthSession) {
  const admin = getSupabaseAdminClient()

  const { error } = await admin.from('profiles').upsert(
    {
      user_id: session.userId,
      email: normalizeEmail(session.email),
      full_name: session.name,
      avatar_url: session.avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) throw error
}

export async function linkGuestCommerceByEmail(userId: string, email: string) {
  const admin = getSupabaseAdminClient()
  const normalizedEmail = normalizeEmail(email)

  const updates = await Promise.all([
    admin
      .from('orders')
      .update({ buyer_user_id: userId })
      .is('buyer_user_id', null)
      .filter('buyer_email', 'ilike', normalizedEmail),
    admin
      .from('purchases')
      .update({ buyer_user_id: userId })
      .is('buyer_user_id', null)
      .filter('buyer_email', 'ilike', normalizedEmail),
    admin
      .from('subscriptions')
      .update({ user_id: userId })
      .is('user_id', null)
      .filter('customer_email', 'ilike', normalizedEmail),
  ])

  for (const result of updates) {
    if (result.error) throw result.error
  }
}

export async function getAccountSummaryByUserId(userId: string): Promise<AccountSummary> {
  const admin = getSupabaseAdminClient()

  const [storeResult, purchaseResult, orderResult, subscriptionResult] = await Promise.all([
    admin.from('stores').select('id', { count: 'exact', head: true }).eq('owner_user_id', userId),
    admin.from('purchases').select('id', { count: 'exact', head: true }).eq('buyer_user_id', userId),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_user_id', userId),
    admin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  for (const result of [storeResult, purchaseResult, orderResult, subscriptionResult]) {
    if (result.error) throw result.error
  }

  return {
    hasStore: (storeResult.count ?? 0) > 0,
    hasPurchases: (purchaseResult.count ?? 0) > 0 || (orderResult.count ?? 0) > 0,
    hasSubscriptions: (subscriptionResult.count ?? 0) > 0,
  }
}

export async function bootstrapAuthenticatedUser(session: AuthSession) {
  await upsertProfile(session)
  await linkGuestCommerceByEmail(session.userId, session.email)
  return getAccountSummaryByUserId(session.userId)
}

export function resolvePostLoginDestination(
  session: AuthSession,
  account: AccountSummary,
  launchIdea?: string,
) {
  if (isAllowedAdminEmail(session.email)) return '/internal/admin'
  void account
  if (launchIdea) {
    return `/dashboard/ai-launch?idea=${encodeURIComponent(launchIdea)}`
  }
  return '/dashboard'
}
