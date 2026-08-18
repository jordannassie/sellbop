import type { User } from '@supabase/supabase-js'

/** True when Supabase confirms the user's email (OAuth or verified email/password). */
export function isAuthenticatedEmailVerified(user: Pick<User, 'email_confirmed_at' | 'app_metadata'>): boolean {
  if (user.email_confirmed_at) return true
  const provider = user.app_metadata?.provider as string | undefined
  if (provider && provider !== 'email') return true
  return false
}
