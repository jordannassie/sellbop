import 'server-only'

import { getAllowedAdminEmails } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAuthenticatedEmailVerified } from '@/lib/auth/email-verification'
import type { AccountSummary, AuthSession } from '@/lib/domain/auth'
import type { User } from '@supabase/supabase-js'

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

  await Promise.all([
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
  ])
}

export async function getAccountSummaryByUserId(userId: string): Promise<AccountSummary> {
  const admin = getSupabaseAdminClient()

  const [storeResult, memberResult, purchaseResult, orderResult] = await Promise.all([
    admin.from('stores').select('id', { count: 'exact', head: true }).eq('owner_user_id', userId),
    admin.from('store_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('purchases').select('id', { count: 'exact', head: true }).eq('buyer_user_id', userId),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_user_id', userId),
  ])

  return {
    hasStore: (storeResult.count ?? 0) > 0 || (memberResult.count ?? 0) > 0,
    hasPurchases: (purchaseResult.count ?? 0) > 0 || (orderResult.count ?? 0) > 0,
    hasSubscriptions: false,
  }
}

export async function bootstrapAuthenticatedUser(session: AuthSession) {
  await upsertProfile(session)
  if (session.emailVerified) {
    await linkGuestCommerceByEmail(session.userId, session.email)
  }
  return getAccountSummaryByUserId(session.userId)
}

export function authSessionFromUser(user: User): AuthSession | null {
  if (!user.email) return null
  return {
    userId: user.id,
    email: user.email,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl:
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null,
    emailVerified: isAuthenticatedEmailVerified(user),
  }
}

export function resolvePostLoginDestination(
  session: AuthSession,
  account: AccountSummary,
) {
  if (isAllowedAdminEmail(session.email)) return '/internal/admin'
  void account
  return '/dashboard'
}
