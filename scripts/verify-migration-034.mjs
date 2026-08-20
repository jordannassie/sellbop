#!/usr/bin/env node
/** Verify migration 034 via service role. Usage: node scripts/verify-migration-034.mjs */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })
const { error } = await admin.from('oauth_authorization_codes').select('access_mode, store_id').limit(1)
console.log('oauth_authorization_codes.access_mode:', error ? `FAIL (${error.message})` : 'OK')
process.exit(error ? 1 : 0)
