import { redirect } from 'next/navigation'
import { bootstrapAuthenticatedUser, resolvePostLoginDestination } from '@/lib/auth/post-login'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { AuthSession } from '@/lib/domain/auth'

export const dynamic = 'force-dynamic'

function toSession(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthSession | null {
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
  }
}

export default async function AuthCompletePage() {
  if (!isSupabaseConfigured()) {
    redirect('/login?error=supabase-not-configured')
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = user ? toSession(user) : null

  if (!session) {
    redirect('/login')
  }

  const account = await bootstrapAuthenticatedUser(session)
  redirect(resolvePostLoginDestination(session, account))
}
