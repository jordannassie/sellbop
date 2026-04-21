'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Browser / client-side Supabase helper
//
// Uses:  NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
// Safe:  throws a clear error only if actually called without env vars.
//        Pages that never call this are unaffected.
// Usage: const db = getSupabaseBrowserClient()
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { env } from '@/lib/env'

type SellBopClient = SupabaseClient<Database>

// Lazy singleton — one shared instance per browser session
let _client: SellBopClient | null = null

/**
 * Returns a Supabase browser client.
 * Throws a descriptive error if env vars are missing so the cause is obvious.
 */
export function getSupabaseBrowserClient(): SellBopClient {
  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error(
      '[Supabase] Browser client not configured.\n' +
      'Add these to your .env.local or Netlify environment variables:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=<your project URL>\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>',
    )
  }

  if (!_client) {
    _client = createClient<Database>(env.supabase.url, env.supabase.anonKey)
  }

  return _client
}
