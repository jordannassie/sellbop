import { redirect } from 'next/navigation'
import { bootstrapAuthenticatedUser, resolvePostLoginDestination, authSessionFromUser } from '@/lib/auth/post-login'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string; intent?: string }>
}) {
  if (!isSupabaseConfigured()) {
    redirect('/login?error=supabase-not-configured')
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = user ? authSessionFromUser(user) : null

  if (!session) {
    redirect('/login')
  }

  void searchParams
  const account = await bootstrapAuthenticatedUser(session)
  redirect(resolvePostLoginDestination(session, account))
}
