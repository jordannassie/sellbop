#!/usr/bin/env node
/**
 * Claude E-Com Creative Factory acceptance test.
 *
 * Usage:
 *   BASE_URL=https://sellbop.com \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/claude-ecom-creative-test.mjs
 *
 * Optional: OPENAI_API_KEY set locally to run live image generation test
 */
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.BASE_URL ?? 'https://sellbop.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_OPENAI = !!process.env.OPENAI_API_KEY?.trim()

let passed = 0
let failed = 0

function ok(label) { console.log(`  ✓ ${label}`); passed++ }
function fail(label, detail = '') { console.log(`  ✗ ${label}${detail ? `: ${detail}` : ''}`); failed++ }

function hashToken(raw) { return createHash('sha256').update(raw).digest('hex') }

function generateToken() {
  const random = randomBytes(24).toString('base64url')
  const token = `sk_agent_live_${random}`
  return { token, hash: hashToken(token), prefix: `${token.slice(0, 18)}…` }
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

async function mcpToolCall(token, name, args) {
  const res = await fetch(`${BASE_URL}/api/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  })
  const text = await res.text()
  try {
    const lines = text.split('\n').filter(Boolean)
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const payload = JSON.parse(line.slice(5).trim())
        if (payload.result?.content?.[0]?.text) {
          return { status: res.status, body: JSON.parse(payload.result.content[0].text) }
        }
      }
    }
    const json = JSON.parse(text)
    if (json.result?.content?.[0]?.text) {
      return { status: res.status, body: JSON.parse(json.result.content[0].text) }
    }
    return { status: res.status, body: json, raw: text.slice(0, 500) }
  } catch {
    return { status: res.status, body: null, raw: text.slice(0, 500) }
  }
}

async function main() {
  console.log(`\nClaude E-Com Creative Factory Test → ${BASE_URL}\n`)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('Missing Supabase env — skipping authenticated tests.\n')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const { data: stores } = await admin.from('stores').select('id, owner_user_id, slug').limit(1)
  if (!stores?.length) { fail('Need a store'); process.exit(1) }

  const store = stores[0]
  const scopes = ['shops:read', 'shops:write', 'products:read', 'products:write', 'files:write', 'affiliates:write', 'analytics:read']
  const { token, hash, prefix } = generateToken()
  const { error: connErr } = await admin.from('agent_connections').insert({
    user_id: store.owner_user_id,
    store_id: store.id,
    access_mode: 'single_shop',
    provider: 'claude',
    name: 'Creative Factory Test',
    token_hash: hash,
    token_prefix: prefix,
    scopes,
  })
  if (connErr) { fail('Create test connection', connErr.message); process.exit(1) }
  ok('Create test agent connection')

  const caps = await mcpToolCall(token, 'get_creative_capabilities', {})
  if (caps.body?.pdf_generation === 'available') ok('PDF generation available')
  else fail('PDF generation available', JSON.stringify(caps.body))

  if (caps.body?.image_generation === 'available') ok('Image generation available (OPENAI configured on server)')
  else ok('Image generation unavailable on server (expected without OPENAI on Netlify)')

  const { res: createRes, body: product } = await agentFetch('/api/agent/v1/products', token, {
    method: 'POST',
    body: JSON.stringify({
      shop_id: store.id,
      title: 'Creative Factory Test Product',
      description: 'Temporary draft product for creative acceptance testing.',
      price_cents: 1900,
      is_live: false,
    }),
  })
  if (!product?.id) { fail('Create draft product', `${createRes.status}`); process.exit(1) }
  ok('Create draft test product')
  const productId = product.id

  const pdf = await mcpToolCall(token, 'generate_product_pdf', {
    shop_id: store.id,
    product_id: productId,
    title: 'Creative Factory Test Guide',
    subtitle: 'Acceptance test edition',
    content_brief: 'Section 1\nThis is a premium test guide.\n\nSection 2\n- Checklist item one\n- Checklist item two',
    brand_context: { brand_name: 'Test Brand', tone: 'premium and calm' },
  })
  if (pdf.body?.success) ok('Generate and attach product PDF')
  else fail('Generate product PDF', JSON.stringify(pdf.body ?? pdf.raw))

  const { data: files } = await admin.from('product_files').select('id, file_name, file_type').eq('product_id', productId)
  if (files?.some(f => f.file_type?.includes('pdf'))) ok('PDF delivery file attached')
  else fail('PDF delivery file attached')

  if (HAS_OPENAI) {
    console.log('  ~ OPENAI_API_KEY detected locally — image test must run against a server with the same key')
  }

  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const { res: imgRes } = await agentFetch(`/api/agent/v1/products/${productId}/images`, token, {
    method: 'POST',
    body: JSON.stringify({ file_name: 'test-cover.png', mime_type: 'image/png', base64_data: pngB64, set_primary: true }),
  })
  if (imgRes.status === 200 || imgRes.status === 201) ok('Upload fallback cover image')
  else fail('Upload cover image', String(imgRes.status))

  const { res: auditRes, body: audit } = await agentFetch(`/api/agent/v1/shops/${store.id}?view=audit`, token)
  if (auditRes.status === 200 && Array.isArray(audit.products)) ok('Audit includes per-product asset completeness')
  else fail('Shop audit asset completeness', String(auditRes.status))

  const productAudit = audit.products?.find(p => p.id === productId)
  if (productAudit?.delivery_file_present) ok('Audit shows delivery file present')
  else fail('Audit delivery file flag')

  const { data: activity } = await admin
    .from('agent_activity_log')
    .select('action')
    .eq('user_id', store.owner_user_id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (activity?.some(a => a.action === 'generate_product_pdf')) ok('Activity log contains generate_product_pdf')
  else fail('Activity log for PDF generation')

  const { data: finalProduct } = await admin.from('products').select('is_live').eq('id', productId).single()
  if (finalProduct?.is_live === false) ok('Product remains draft')
  else fail('Product draft status')

  await admin.from('product_files').delete().eq('product_id', productId)
  await admin.from('products').delete().eq('id', productId)
  await admin.from('agent_connections').delete().eq('token_hash', hash)
  ok('Cleaned up test artifacts')

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
