#!/usr/bin/env node
/**
 * Apply migration 024_purchase_delivery_and_email.sql and verify schema.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres" \
 *     node scripts/apply-migration-024.mjs
 *
 * Get DATABASE_URL from Supabase Dashboard → Project Settings → Database → Connection string (URI).
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationFile = '024_purchase_delivery_and_email.sql'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable.')
  console.error('Get it from Supabase → Project Settings → Database → Connection string (URI).')
  process.exit(1)
}

const sql = readFileSync(join(root, 'supabase/migrations', migrationFile), 'utf8')

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

async function verify() {
  const checks = []

  const col = await client.query(`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'purchases'
      AND column_name = 'access_token'
  `)
  checks.push({
    name: 'purchases.access_token column',
    ok: col.rows.length === 1,
    detail: col.rows[0] ?? null,
  })

  const purchaseStats = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(access_token)::int AS with_token,
      COUNT(DISTINCT access_token)::int AS unique_tokens
    FROM purchases
  `)
  const ps = purchaseStats.rows[0]
  checks.push({
    name: 'purchases backfill',
    ok: ps.total === ps.with_token && ps.total === ps.unique_tokens,
    detail: ps,
  })

  const refunded = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'refunded_cents'
  `)
  checks.push({
    name: 'orders.refunded_cents column',
    ok: refunded.rows.length === 1,
  })

  const stripeIdx = await client.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND indexname = 'orders_stripe_session_id_uidx'
  `)
  checks.push({
    name: 'orders stripe_session_id unique index',
    ok: stripeIdx.rows.length === 1,
  })

  const emailTable = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transactional_email_deliveries'
  `)
  checks.push({
    name: 'transactional_email_deliveries table',
    ok: emailTable.rows.length === 1,
  })

  const emailIdx = await client.query(`
    SELECT COUNT(*)::int AS count FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'transactional_email_deliveries'
  `)
  checks.push({
    name: 'transactional_email_deliveries indexes',
    ok: emailIdx.rows[0].count >= 5,
    detail: { indexCount: emailIdx.rows[0].count },
  })

  return checks
}

try {
  await client.connect()
  console.log('Connected to Supabase Postgres.')
  console.log(`Applying ${migrationFile}...`)
  await client.query(sql)
  console.log(`✓ ${migrationFile} applied`)

  console.log('\nVerifying schema...')
  const checks = await verify()
  let allOk = true
  for (const check of checks) {
    const mark = check.ok ? '✓' : '✗'
    console.log(`  ${mark} ${check.name}${check.detail ? ` — ${JSON.stringify(check.detail)}` : ''}`)
    if (!check.ok) allOk = false
  }

  if (!allOk) {
    console.error('\nVerification failed.')
    process.exit(1)
  }

  console.log('\nMigration 024 applied and verified successfully.')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
