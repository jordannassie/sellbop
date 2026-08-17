import 'server-only'

import { isSupabaseConfigured } from '@/lib/env'

/**
 * Read the platform-wide demo mode flag from the app_settings table.
 *
 * Returns false (demo OFF) as a safe default when:
 *   - Supabase is not configured
 *   - The app_settings table has not been migrated yet
 *   - The 'demo_mode' key does not exist
 *   - Any query error occurs
 */
export async function getDemoMode(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'demo_mode')
      .maybeSingle()

    return Boolean((data?.value as { enabled?: boolean } | null)?.enabled)
  } catch {
    return false
  }
}

/** Alias — use whichever reads more clearly at the call site. */
export const isDemoModeEnabled = getDemoMode
