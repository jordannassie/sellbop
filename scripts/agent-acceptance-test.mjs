#!/usr/bin/env node
/**
 * SellBop AI Agent Phase 1 acceptance test.
 *
 * Usage:
 *   BASE_URL=https://sellbop.com \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/agent-acceptance-test.mjs
 *
 * Optional: AGENT_TOKEN=sk_agent_live_... to skip token creation
 */
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.BASE_URL ?? 'https://sellbop.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PROVIDED_TOKEN = process.env.AGENT_TOKEN

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

function hashToken(raw) {
  return createHash('sha256').update(raw).digest('hex')
}

function generateToken() {
  const random = randomBytes(24).toString('base64url')
  const token = `sk_agent_live_${random}`
  return {
    token,
    hash: hashToken(token),
    prefix: `${token.slice(0, 18)}…`,
  }
}

async function agentFetch(path, token, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

async function main() {
  console.log(`\nSellBop Agent Acceptance Test → ${BASE_URL}\n`)

  // Test 2a — unauthenticated
  const unauth = await fetch(`${BASE_URL}/api/agent/v1/store`)
  const unauthBody = await unauth.json().catch(() => ({}))
  if (unauth.status === 401) ok('GET /api/agent/v1/store without token → 401')
  else fail('GET /api/agent/v1/store without token → 401', `got ${unauth.status}`)

  const mcpUnauth = await fetch(`${BASE_URL}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (mcpUnauth.status === 401) ok('POST /api/mcp without token → 401')
  else fail('POST /api/mcp without token → 401', `got ${mcpUnauth.status}`)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('\nSkipping authenticated tests (missing Supabase env).\n')
    process.exit(failed > 0 ? 1 : 0)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Check tables exist
  const { error: tableErr } = await admin.from('agent_connections').select('id').limit(1)
  if (tableErr?.code === 'PGRST205') {
    console.log('\n⚠ agent_connections table missing — run migrations first:')
    console.log('  node scripts/apply-migrations.mjs (requires DATABASE_URL)\n')
    process.exit(1)
  }

  // Find two sellers with stores
  const { data: stores } = await admin.from('stores').select('id, owner_user_id').limit(10)
  if (!stores?.length) {
    fail('Need at least one store in database')
    process.exit(1)
  }

  const sellerA = stores[0]
  const sellerB = stores.length > 1 ? stores[1] : null

  const scopes = ['shops:read', 'shops:write', 'products:read', 'products:write', 'files:write', 'affiliates:write', 'analytics:read']
  let tokenA = PROVIDED_TOKEN

  if (!tokenA) {
    const { token, hash, prefix } = generateToken()
    tokenA = token
    const { error } = await admin.from('agent_connections').insert({
      user_id: sellerA.owner_user_id,
      store_id: sellerA.id,
      access_mode: 'single_shop',
      provider: 'claude',
      name: 'Acceptance Test Connection',
      token_hash: hash,
      token_prefix: prefix,
      scopes,
    })
    if (error) fail('Create test agent connection', error.message)
    else ok('Create test agent connection')
  }

  // Test 2b — authenticated store read
  const { res: storeRes, body: storeBody } = await agentFetch('/api/agent/v1/store', tokenA)
  if (storeRes.status === 200 && storeBody.id) ok('GET /api/agent/v1/store with token → own store')
  else fail('GET /api/agent/v1/store with token', `${storeRes.status} ${JSON.stringify(storeBody)}`)

  // Claude E-Com V1 — list shops
  const { res: shopsRes, body: shopsBody } = await agentFetch('/api/agent/v1/shops', tokenA)
  if (shopsRes.status === 200 && Array.isArray(shopsBody.shops)) ok('GET /api/agent/v1/shops → authorized shops')
  else fail('GET /api/agent/v1/shops', `${shopsRes.status} ${JSON.stringify(shopsBody)}`)

  const shopId = shopsBody.shops?.[0]?.id ?? storeBody.id
  if (shopId) {
    const { res: snapRes, body: snapBody } = await agentFetch(`/api/agent/v1/shops/${shopId}?view=snapshot`, tokenA)
    if (snapRes.status === 200 && snapBody.shop) ok('GET shop snapshot')
    else fail('GET shop snapshot', `${snapRes.status}`)

    const { res: auditRes, body: auditBody } = await agentFetch(`/api/agent/v1/shops/${shopId}?view=audit`, tokenA)
    if (auditRes.status === 200 && typeof auditBody.product_count === 'number') ok('GET shop audit')
    else fail('GET shop audit', `${auditRes.status}`)
  }

  // Test 3 — store isolation
  if (sellerB) {
    let tokenB
    const { token, hash, prefix } = generateToken()
    tokenB = token
    await admin.from('agent_connections').insert({
      user_id: sellerB.owner_user_id,
      store_id: sellerB.id,
      access_mode: 'single_shop',
      provider: 'claude',
      name: 'Acceptance Test B',
      token_hash: hash,
      token_prefix: prefix,
      scopes,
    })

    const { data: productsA } = await admin.from('products').select('id').eq('store_id', sellerA.id).limit(1)
    if (productsA?.length) {
      const { res } = await agentFetch(`/api/agent/v1/products/${productsA[0].id}`, tokenB)
      if (res.status === 404 || res.status === 403) ok('Seller B token cannot read Seller A product')
      else fail('Store isolation', `expected 403/404, got ${res.status}`)
    } else {
      console.log('  ~ Skipping isolation test (no products for seller A)')
    }
  }

  // Test 4 — create product
  const { res: createRes, body: createBody } = await agentFetch('/api/agent/v1/products', tokenA, {
    method: 'POST',
    body: JSON.stringify({
      title: 'AI Test Product',
      description: 'Test product created through the SellBop AI Agent integration.',
      price_cents: 2900,
      affiliate_enabled: true,
      affiliate_commission_percent: 30,
      is_live: false,
    }),
  })

  let productId = createBody?.id
  if (createRes.status === 200 || createRes.status === 201) {
    ok('Create AI Test Product as draft')
  } else {
    fail('Create product', `${createRes.status} ${JSON.stringify(createBody)}`)
  }

  if (productId) {
    // Upload test PDF (minimal)
    const pdfB64 = Buffer.from('%PDF-1.4 test').toString('base64')
    const { res: fileRes } = await agentFetch(`/api/agent/v1/products/${productId}/files`, tokenA, {
      method: 'POST',
      body: JSON.stringify({
        file_name: 'test-guide.pdf',
        mime_type: 'application/pdf',
        base64_data: pdfB64,
      }),
    })
    if (fileRes.status === 200 || fileRes.status === 201) ok('Upload test PDF')
    else fail('Upload test PDF', String(fileRes.status))

    // Upload 1x1 PNG
    const pngB64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const { res: imgRes } = await agentFetch(`/api/agent/v1/products/${productId}/images`, tokenA, {
      method: 'POST',
      body: JSON.stringify({
        file_name: 'cover.png',
        mime_type: 'image/png',
        base64_data: pngB64,
        set_primary: true,
      }),
    })
    if (imgRes.status === 200 || imgRes.status === 201) ok('Upload cover image')
    else fail('Upload cover image', String(imgRes.status))

    // Verify product state
    const { data: product } = await admin.from('products').select('*').eq('id', productId).single()
    if (product?.title === 'AI Test Product') ok('Product title correct')
    else fail('Product title')
    if (product?.price_cents === 2900) ok('Price $29 correct')
    else fail('Price', String(product?.price_cents))
    if (product?.affiliate_enabled === true) ok('Affiliates enabled')
    else fail('Affiliates enabled')
    if (product?.affiliate_commission_percent === 30) ok('Commission 30% correct')
    else fail('Commission')
    if (product?.is_live === false) ok('Product remains draft')
    else fail('Draft status', String(product?.is_live))

    // Test 6 — activity log
    const { data: activity } = await admin
      .from('agent_activity_log')
      .select('action')
      .eq('user_id', sellerA.owner_user_id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (activity?.some(a => a.action === 'create_product')) ok('AI Activity log contains create_product')
    else fail('AI Activity log')
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
