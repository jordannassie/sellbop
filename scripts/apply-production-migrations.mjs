#!/usr/bin/env node
/**
 * Apply migrations 029 + 030 to production (requires DATABASE_URL).
 * Verifies project ref qsvmgzdaashfsavmfjuz before executing.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.qsvmgzdaashfsavmfjuz:...@...pooler.supabase.com:6543/postgres" \
 *     node scripts/apply-production-migrations.mjs
 *
 * Or apply individually:
 *   npm run db:apply-029
 *   npm run db:apply-030
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(script) {
  const result = spawnSync('node', [join(root, 'scripts', script)], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('=== SellBop production migration activation ===')
console.log('Project ref: qsvmgzdaashfsavmfjuz')
console.log('Step 1/3: Apply 029 (store_members)...')
run('apply-migration-029.mjs')
console.log('Step 2/3: Verify after 029...')
run('verify-production-schema.mjs')
console.log('Step 3/3: Apply 030 (partner shops)...')
run('apply-migration-030.mjs')
console.log('Final verification...')
run('verify-production-schema.mjs')
console.log('=== Migrations applied. Run production smoke tests next. ===')
