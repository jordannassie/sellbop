#!/usr/bin/env node
/** Verify migration 032 columns via service role (no DATABASE_URL required). */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

const { error: connErr } = await admin.from('agent_connections').select('access_mode').limit(1)
const { error: logErr } = await admin.from('agent_activity_log').select('store_id').limit(1)

console.log('Migration 032 verification:')
console.log('  agent_connections.access_mode:', connErr ? `FAIL (${connErr.message})` : 'OK')
console.log('  agent_activity_log.store_id:', logErr ? `FAIL (${logErr.message})` : 'OK')

if (connErr || logErr) {
  console.error('\nApply: paste APPLY-032-IN-SUPABASE.sql in Supabase SQL Editor')
  console.error('https://supabase.com/dashboard/project/qsvmgzdaashfsavmfjuz/sql/new')
  process.exit(1)
}

console.log('\nAll 032 columns verified.')
process.exit(0)
