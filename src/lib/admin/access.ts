import 'server-only'

import { redirect } from 'next/navigation'
import { getAllowedAdminEmails, isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function requireAdminUser() {
  if (!isSupabaseConfigured()) {
    redirect('/login?error=supabase-not-configured')
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/login')
  }

  const allowedEmails = getAllowedAdminEmails()

  if (!allowedEmails.includes(user.email.toLowerCase())) {
    redirect('/')
  }

  return user
}
