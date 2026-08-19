#!/usr/bin/env node
/**
 * Apply migration 026_partner_badge_default_on.sql
 *
 * Usage:
 *   npm run db:apply-026
 */
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationFile = '026_partner_badge_default_on.sql'
const EXPECTED_PROJECT_REF = 'qsvmgzdaashfsavmfjuz'

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

function isValidDatabaseUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('No value set')) return false
  return /^postgres(ql)?:\/\//.test(url) && url.includes('@')
}

function resolveDatabaseUrl() {
  const fileVars = {
    ...parseEnvFile(join(root, '.env')),
    ...parseEnvFile(join(root, '.env.local')),
    ...parseEnvFile(join(root, '.env.production')),
  }
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DIRECT_URL,
    fileVars.DATABASE_URL,
    fileVars.POSTGRES_URL,
    fileVars.DIRECT_URL,
  ].filter(Boolean)

  for (const url of candidates) {
    if (isValidDatabaseUrl(url)) return url
  }
  return null
}

const databaseUrl = resolveDatabaseUrl()
if (!databaseUrl) {
  console.error('Missing valid DATABASE_URL (postgresql://... with @host).')
  console.error('Set it in the environment or in .env.local, then run: npm run db:apply-026')
  process.exit(1)
}

if (!databaseUrl.includes(EXPECTED_PROJECT_REF)) {
  console.error(`DATABASE_URL does not reference production project ref ${EXPECTED_PROJECT_REF}.`)
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  const sql = readFileSync(join(root, 'supabase/migrations', migrationFile), 'utf8')
  console.log(`Applying ${migrationFile}...`)
  await client.query(sql)
  const { rows } = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_partner)::int AS partners,
      COUNT(*) FILTER (WHERE show_partner_badge)::int AS badge_on
    FROM public.profiles
  `)
  console.log('Partner defaults:', rows[0])
  await client.end()
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
