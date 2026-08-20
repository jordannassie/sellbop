#!/usr/bin/env node
/**
 * Gate 1 Partner Shop E2E verification (service role, production-safe read/write on test data).
 * Run: node scripts/partner-shop-gate1-e2e.mjs
 *
 * Creates a controlled test Partner Shop, verifies DB state, cleans up test slug if configured.
 */
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_USER_ID = process.env.SELLBOP_ADMIN_USER_ID

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function main() {
  console.log('=== Gate 1 Partner Shop E2E (DB layer) ===')

  const { error: partnershipsErr } = await admin.from('store_partnerships').select('id').limit(1)
  if (partnershipsErr) {
    console.error('store_partnerships not available:', partnershipsErr.message)
    process.exit(1)
  }

  if (!ADMIN_USER_ID) {
    console.log('Set SELLBOP_ADMIN_USER_ID to run create/claim tests. Running schema checks only.')
    const { count } = await admin.from('store_members').select('*', { count: 'exact', head: true })
    console.log('store_members count:', count)
    console.log('create_partner_shop RPC: checking...')
    const { error: rpcErr } = await admin.rpc('create_partner_shop', {
      p_admin_user_id: '00000000-0000-0000-0000-000000000000',
      p_shop_name: '__probe__',
      p_shop_slug: `__probe-${Date.now()}__`,
    })
    console.log('RPC exists:', !rpcErr?.message?.includes('Could not find'))
    return
  }

  const slug = `sellbop-partner-test-${Date.now()}`
  const { data: created, error: createErr } = await admin.rpc('create_partner_shop', {
    p_admin_user_id: ADMIN_USER_ID,
    p_shop_name: 'SellBop Partner Test',
    p_shop_slug: slug,
    p_partner_name: 'SellBop Test Partner',
    p_partner_email: null,
  })

  if (createErr) {
    console.error('create_partner_shop failed:', createErr.message)
    process.exit(1)
  }

  const row = Array.isArray(created) ? created[0] : created
  const storeId = row?.out_store_id
  const partnershipId = row?.out_partnership_id
  console.log('Created store:', storeId, 'partnership:', partnershipId)

  const { data: partnership } = await admin.from('store_partnerships').select('*').eq('id', partnershipId).single()
  console.log('Status draft:', partnership?.status === 'draft' ? 'PASS' : 'FAIL')
  console.log('Partner user null:', partnership?.partner_user_id === null ? 'PASS' : 'FAIL')

  const { data: members } = await admin.from('store_members').select('user_id, role').eq('store_id', storeId)
  const adminOwner = members?.find(m => m.user_id === ADMIN_USER_ID && m.role === 'owner')
  console.log('Admin owner membership:', adminOwner ? 'PASS' : 'FAIL')

  const previewToken = randomBytes(32).toString('base64url')
  const previewHash = hashToken(previewToken)
  await admin.from('partner_shop_preview_tokens').insert({
    partnership_id: partnershipId,
    token_hash: previewHash,
    created_by_user_id: ADMIN_USER_ID,
  })
  const { data: previewRow } = await admin.from('partner_shop_preview_tokens').select('token_hash').eq('partnership_id', partnershipId).single()
  console.log('Preview token hashed (not raw):', previewRow?.token_hash === previewHash && previewRow.token_hash !== previewToken ? 'PASS' : 'FAIL')

  console.log('\nTest shop slug:', slug)
  console.log('Preview URL would be: /preview/[token] (token not logged)')
  console.log('\nManual steps: Manage Shop, build product, invite, claim, accept terms, activate.')
  console.log('Do NOT delete production test data automatically.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
