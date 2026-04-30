import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from './types'

type SellBopAdminClient = SupabaseClient<Database>

export function getSupabaseAdminClient(): SellBopAdminClient {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    throw new Error(
      '[Supabase] Admin client not configured.\n' +
      'Add these to your Netlify environment variables:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=<your project URL>\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<your service role secret>\n' +
      'WARNING: The service role key bypasses Row Level Security. Keep it server-side only.',
    )
  }

  return createClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
