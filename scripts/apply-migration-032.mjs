#!/usr/bin/env node
/** Apply migration 032 — agent shop access. Requires DATABASE_URL. */
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, '../supabase/migrations/032_agent_shop_access.sql'), 'utf8')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(sql)
  console.log('Migration 032 applied.')
} finally {
  await client.end()
}
