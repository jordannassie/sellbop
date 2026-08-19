import 'server-only'

import { getAllowedAdminEmails, isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function verifyPlatformAdmin(): Promise<{ userId: string; email: string } | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return null
    if (!getAllowedAdminEmails().includes(user.email.toLowerCase())) return null
    return { userId: user.id, email: user.email }
  } catch {
    return null
  }
}
