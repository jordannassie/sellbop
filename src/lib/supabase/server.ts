import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from './types'

type SellBopServerClient = SupabaseClient<Database>

function assertPublicSupabaseEnv() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error(
      '[Supabase] Server client not configured.\n' +
      'Add these to your local env or Netlify site variables:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=<your project URL>\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>',
    )
  }
}

export async function getSupabaseServerClient(): Promise<SellBopServerClient> {
  assertPublicSupabaseEnv()

  const cookieStore = await cookies()

  return createServerClient<Database>(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components may be read-only; route handlers/proxy can persist.
        }
      },
    },
  })
}
