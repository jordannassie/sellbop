#!/usr/bin/env node
/**
 * Verify migration 024 schema via Supabase service role (no DATABASE_URL required).
 * Run: node scripts/verify-migration-024.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

const checks = []

async function check(name, fn) {
  try {
    const ok = await fn()
    checks.push({ name, ok })
    console.log(`${ok ? '✓' : '✗'} ${name}`)
  } catch (err) {
    checks.push({ name, ok: false, error: err.message })
    console.log(`✗ ${name} — ${err.message}`)
  }
}

await check('purchases.access_token column', async () => {
  const { error } = await admin.from('purchases').select('access_token').limit(1)
  return !error
})

await check('purchases backfill (sample has token)', async () => {
  const { data, error } = await admin.from('purchases').select('id, access_token').limit(20)
  if (error) return false
  if (!data?.length) return true
  return data.every(p => p.access_token)
})

await check('orders.refunded_cents column', async () => {
  const { error } = await admin.from('orders').select('refunded_cents').limit(1)
  return !error
})

await check('transactional_email_deliveries table', async () => {
  const { error } = await admin.from('transactional_email_deliveries').select('id').limit(1)
  return !error
})

const failed = checks.filter(c => !c.ok)
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed. Migration 024 may not be applied.`)
  process.exit(1)
}
console.log('\nMigration 024 schema verified.')
