// ─────────────────────────────────────────────────────────────────────────────
// Server-only Supabase admin helper
//
// Uses:   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// Guard:  `import 'server-only'` prevents this from bundling into client code.
//         If imported in a client component the build will hard-fail with a
//         clear message — that is intentional.
//
// NEVER expose the service role key to the browser.
//
// Usage (API routes, Server Actions, server components):
//   const db = getSupabaseAdminClient()
//   const { data } = await db.from('stores').select('*')
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { env } from '@/lib/env'

type SellBopAdminClient = SupabaseClient<Database>

/**
 * Creates a new Supabase admin client with the service role key.
 * A new instance per call is intentional — avoids cross-request state leaks
 * in serverless/edge environments.
 */
export function getSupabaseAdminClient(): SellBopAdminClient {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    throw new Error(
      '[Supabase] Admin client not configured.\n' +
      'Add these to your Netlify environment variables (NOT .env.local for production):\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=<your project URL>\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<your service role secret>\n' +
      'WARNING: The service role key bypasses Row Level Security. Keep it server-side only.',
    )
  }

  return createClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      // Server clients don't persist sessions — each request is independent
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
