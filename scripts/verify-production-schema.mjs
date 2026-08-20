#!/usr/bin/env node
/**
 * Production schema + data snapshot (service role; no DATABASE_URL required).
 * Run: node scripts/verify-production-schema.mjs
 */
import { createClient } from '@supabase/supabase-js'

const EXPECTED_REF = 'qsvmgzdaashfsavmfjuz'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!url.includes(EXPECTED_REF)) {
  console.error(`Supabase URL does not reference production project ${EXPECTED_REF}`)
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

function isMissingTable(error) {
  if (!error) return false
  const msg = error.message ?? ''
  return (
    error.code === 'PGRST205'
    || error.code === '42P01'
    || msg.includes('schema cache')
    || msg.includes('Could not find the table')
    || msg.includes('does not exist')
  )
}

async function countTable(table) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    if (isMissingTable(error)) return { table, count: null, missing: true }
    throw new Error(`${table}: ${error.message}`)
  }
  return { table, count: count ?? 0, missing: false }
}

async function tableExists(table) {
  const { error } = await admin.from(table).select('id').limit(1)
  if (!error) return true
  if (isMissingTable(error)) return false
  throw new Error(`${table}: ${error.message}`)
}

async function main() {
  console.log('Production project:', EXPECTED_REF)
  console.log('Supabase URL:', url)
  console.log('--- BEFORE / CURRENT COUNTS ---')

  for (const table of ['profiles', 'stores', 'products', 'orders', 'purchases']) {
    const r = await countTable(table)
    console.log(`${table}:`, r.missing ? 'MISSING' : r.count)
  }

  const storeMembersExists = await tableExists('store_members')
  const partnershipsExists = await tableExists('store_partnerships')
  const invitesExists = await tableExists('partner_shop_invites')
  const previewExists = await tableExists('partner_shop_preview_tokens')
  const financialTermsExists = await tableExists('partnership_financial_terms')
  const orderFinancialsExists = await tableExists('order_financials')

  console.log('--- MIGRATION TABLES ---')
  console.log('store_members:', storeMembersExists ? 'EXISTS' : 'NOT APPLIED')
  console.log('store_partnerships:', partnershipsExists ? 'EXISTS' : 'NOT APPLIED')
  console.log('partner_shop_invites:', invitesExists ? 'EXISTS' : 'NOT APPLIED')
  console.log('partner_shop_preview_tokens:', previewExists ? 'EXISTS' : 'NOT APPLIED')
  console.log('partnership_financial_terms (031):', financialTermsExists ? 'EXISTS' : 'NOT APPLIED')
  console.log('order_financials (031):', orderFinancialsExists ? 'EXISTS' : 'NOT APPLIED')

  if (storeMembersExists) {
    const { count } = await countTable('store_members')
    console.log('store_members count:', count)
  }

  console.log('--- JORDAN SHOP ---')
  const { data: jordan, error: jordanErr } = await admin
    .from('stores')
    .select('id, slug, name, owner_user_id, stripe_account_id')
    .eq('slug', 'jordan-nassie')
    .maybeSingle()

  if (jordanErr) throw jordanErr
  if (!jordan) {
    console.log('jordan-nassie: NOT FOUND')
  } else {
    const { count: productCount } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', jordan.id)

    console.log(JSON.stringify({
      ...jordan,
      product_count: productCount ?? 0,
    }, null, 2))

    if (storeMembersExists) {
      const { data: members } = await admin
        .from('store_members')
        .select('user_id, role')
        .eq('store_id', jordan.id)
      console.log('jordan store_members:', members ?? [])
    }
  }

  if (storeMembersExists) {
    const { data: stores } = await admin
      .from('stores')
      .select('id, slug, owner_user_id')
      .not('owner_user_id', 'is', null)

    const { data: members } = await admin.from('store_members').select('store_id, user_id, role')
    const memberSet = new Set((members ?? []).map(m => `${m.store_id}:${m.user_id}`))
    const missingBackfill = (stores ?? []).filter(s => !memberSet.has(`${s.id}:${s.owner_user_id}`))
    console.log('--- BACKFILL GAPS (owner without membership) ---')
    console.log('count:', missingBackfill.length)
    if (missingBackfill.length) console.log(missingBackfill)

    const dupCheck = new Map()
    for (const m of members ?? []) {
      const key = `${m.store_id}:${m.user_id}`
      dupCheck.set(key, (dupCheck.get(key) ?? 0) + 1)
    }
    const duplicates = [...dupCheck.entries()].filter(([, n]) => n > 1)
    console.log('duplicate memberships:', duplicates.length)
  }

  if (partnershipsExists) {
    const { count } = await countTable('store_partnerships')
    console.log('store_partnerships count:', count)
    const { data: jordanPartnership } = await admin
      .from('store_partnerships')
      .select('id, status')
      .eq('store_id', jordan?.id ?? '')
      .maybeSingle()
    console.log('jordan partnership row:', jordanPartnership ?? 'none (expected for normal shop)')

    const { error: rpcErr } = await admin.rpc('create_partner_shop', {
      p_admin_user_id: '00000000-0000-0000-0000-000000000000',
      p_shop_name: '__rpc_probe__',
      p_shop_slug: '__rpc_probe_invalid__',
    })
    const rpcMissing = rpcErr?.message?.includes('Could not find') || rpcErr?.message?.includes('does not exist')
    console.log('create_partner_shop RPC:', rpcMissing ? 'MISSING' : 'EXISTS')

    const { error: claimErr } = await admin.rpc('claim_partner_shop', {
      p_token_hash: 'probe',
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_user_email: 'probe@test.com',
    })
    const claimMissing = claimErr?.message?.includes('Could not find') || claimErr?.message?.includes('does not exist')
    console.log('claim_partner_shop RPC:', claimMissing ? 'MISSING' : 'EXISTS')
  }

  const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
  console.log('--- AUTH ---')
  console.log('auth users API:', authData?.users ? 'ok' : 'unknown')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
