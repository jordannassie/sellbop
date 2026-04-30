'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from '@/lib/env'
import type { Database } from './types'

type SellBopClient = SupabaseClient<Database>

let client: SellBopClient | null = null

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!client) {
    client = createBrowserClient<Database>(env.supabase.url!, env.supabase.anonKey!)
  }

  return client
}
