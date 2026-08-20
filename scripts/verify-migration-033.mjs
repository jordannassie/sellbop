#!/usr/bin/env node
/** Verify migration 033 table via service role (no DATABASE_URL required). */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

const { error: tableErr } = await admin.from('creative_generation_usage').select('id').limit(1)

console.log('Migration 033 verification:')
console.log('  creative_generation_usage table:', tableErr ? `FAIL (${tableErr.message})` : 'OK')

if (tableErr) {
  console.error('\nApply: paste APPLY-033-IN-SUPABASE.sql in Supabase SQL Editor')
  console.error('https://supabase.com/dashboard/project/qsvmgzdaashfsavmfjuz/sql/new')
  process.exit(1)
}

console.log('\nAll 033 objects verified.')
process.exit(0)
