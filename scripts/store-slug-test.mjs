#!/usr/bin/env node
/**
 * Slug validation smoke test + optional Juice & Toya slug migration.
 *
 * Usage:
 *   node scripts/store-slug-test.mjs
 *
 * Migration (requires Supabase service role):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/store-slug-test.mjs --migrate-juice-and-toya
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.BASE_URL ?? 'https://sellbop.com'
const MIGRATE = process.argv.includes('--migrate-juice-and-toya')

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function fail(label, detail = '') {
  console.log(`  ✗ ${label}${detail ? `: ${detail}` : ''}`)
  failed++
}

async function checkAvailability(slug, storeId) {
  const params = new URLSearchParams({ value: slug })
  if (storeId) params.set('storeId', storeId)
  const res = await fetch(`${BASE_URL}/api/availability/store-link?${params}`)
  return res.json()
}

async function main() {
  console.log(`\nStore Slug Tests → ${BASE_URL}\n`)

  const reserved = await checkAvailability('dashboard')
  if (reserved.status === 'invalid') ok('reserved slug "dashboard" rejected')
  else fail('reserved slug "dashboard" rejected', reserved.status)

  const upper = await checkAvailability('JuiceAndToya')
  if (upper.slug === 'juiceandtoya') ok('uppercase normalizes to lowercase')
  else fail('uppercase normalizes to lowercase', upper.slug)

  const spaces = await checkAvailability('juice and toya')
  if (spaces.slug === 'juice-and-toya') ok('spaces normalize to hyphens')
  else fail('spaces normalize to hyphens', spaces.slug)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('\nSkipping DB tests (missing Supabase env).\n')
    process.exit(failed > 0 ? 1 : 0)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const { data: jessicaShop } = await admin
    .from('stores')
    .select('id, slug, name, owner_user_id')
    .eq('slug', 'jessica')
    .maybeSingle()

  const { data: juiceShop } = await admin
    .from('stores')
    .select('id, slug, name')
    .eq('slug', 'juiceandtoya')
    .maybeSingle()

  if (jessicaShop) {
    ok(`found Juice & Toya candidate shop: ${jessicaShop.name} (${jessicaShop.id}) slug=jessica`)
    const own = await checkAvailability('jessica', jessicaShop.id)
    if (own.status === 'available') ok('unchanged slug available for same shop')
    else fail('unchanged slug available for same shop', own.status)
  } else if (juiceShop) {
    ok(`shop already at juiceandtoya (${juiceShop.id})`)
  } else {
    console.log('  · no shop with slug "jessica" or "juiceandtoya" found in DB')
  }

  const juiceAvail = await checkAvailability('juiceandtoya', jessicaShop?.id)
  if (juiceAvail.status === 'available' || (juiceShop && jessicaShop?.id === juiceShop.id)) {
    ok('juiceandtoya availability check passed')
  } else if (juiceShop && juiceShop.id !== jessicaShop?.id) {
    fail('juiceandtoya availability', 'already taken by another shop')
  } else {
    fail('juiceandtoya availability', juiceAvail.status)
  }

  if (MIGRATE && jessicaShop && !juiceShop) {
    console.log('\nMigrating jessica → juiceandtoya …')
    const beforeId = jessicaShop.id
    const { data: updated, error } = await admin
      .from('stores')
      .update({ slug: 'juiceandtoya', updated_at: new Date().toISOString() })
      .eq('id', beforeId)
      .select('id, slug, name')
      .single()

    if (error) {
      fail('migrate slug', error.message)
    } else if (updated.id !== beforeId) {
      fail('shop id unchanged', `got ${updated.id}`)
    } else if (updated.slug !== 'juiceandtoya') {
      fail('new slug', updated.slug)
    } else {
      ok(`migrated shop ${updated.name}: jessica → juiceandtoya (id ${updated.id} unchanged)`)

      const { data: bySlug } = await admin.from('stores').select('id').eq('slug', 'juiceandtoya').maybeSingle()
      if (bySlug?.id === beforeId) ok('get_shop_by_slug("juiceandtoya") resolves same shop')
      else fail('get_shop_by_slug("juiceandtoya") resolves same shop')

      const { data: oldSlug } = await admin.from('stores').select('id').eq('slug', 'jessica').maybeSingle()
      if (!oldSlug) ok('old slug jessica no longer active')
      else fail('old slug jessica no longer active', 'still exists')
    }
  } else if (MIGRATE && juiceShop) {
    console.log(`\nSkip migrate — juiceandtoya already exists (${juiceShop.id})`)
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
