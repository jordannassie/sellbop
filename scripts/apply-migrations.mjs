#!/usr/bin/env node
/**
 * Apply pending Supabase migrations (013 + 014) via direct Postgres connection.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres" \
 *     node scripts/apply-migrations.mjs
 *
 * Get DATABASE_URL from Supabase Dashboard → Project Settings → Database → Connection string (URI).
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const MIGRATIONS = [
  '013_resources_center.sql',
  '014_agent_integrations.sql',
]

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable.')
  console.error('Get it from Supabase → Project Settings → Database → Connection string (URI).')
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

async function tableExists(name) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  )
  return rows.length > 0
}

try {
  await client.connect()
  console.log('Connected to Supabase Postgres.')

  for (const file of MIGRATIONS) {
    const sql = readFileSync(join(root, 'supabase/migrations', file), 'utf8')
    console.log(`Applying ${file}...`)
    await client.query(sql)
    console.log(`  ✓ ${file} applied`)
  }

  const checks = ['resource_pages', 'agent_connections', 'agent_activity_log', 'seller_onboarding']
  for (const table of checks) {
    const ok = await tableExists(table)
    console.log(`  ${ok ? '✓' : '✗'} table ${table}`)
  }

  console.log('\nAll migrations applied successfully.')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
