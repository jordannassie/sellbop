#!/usr/bin/env node
/**
 * Multi-shop Claude E-Com authorization tests.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/agent-access-mode-test.mjs
 *
 * Optional:
 *   JORDAN_USER_EMAIL=jordan@...  — run Jordan-specific Juice & Toya checks
 */
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.BASE_URL ?? 'https://sellbop.com'
const JORDAN_EMAIL = process.env.JORDAN_USER_EMAIL

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

function makeToken() {
  const random = randomBytes(24).toString('base64url')
  const token = `sk_agent_live_${random}`
  return { token, hash: hashToken(token), prefix: `${token.slice(0, 18)}…` }
}

async function agentFetch(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

async function createConnection(admin, userId, { accessMode, storeId, label }) {
  const scopes = ['shops:read', 'shops:write', 'products:read', 'products:write', 'files:write', 'affiliates:write', 'analytics:read']
  const { token, hash, prefix } = makeToken()
  const { error } = await admin.from('agent_connections').insert({
    user_id: userId,
    store_id: storeId,
    access_mode: accessMode,
    provider: 'claude',
    name: label,
    token_hash: hash,
    token_prefix: prefix,
    scopes,
  })
  if (error) throw new Error(error.message)
  return token
}

async function main() {
  console.log(`\nAgent Access Mode Tests → ${BASE_URL}\n`)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('Missing Supabase env.\n')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const { data: stores } = await admin.from('stores').select('id, owner_user_id, slug, name').order('created_at')
  if (!stores?.length) {
    fail('need stores in database')
    process.exit(1)
  }

  const byOwner = new Map()
  for (const s of stores) {
    if (!byOwner.has(s.owner_user_id)) byOwner.set(s.owner_user_id, [])
    byOwner.get(s.owner_user_id).push(s)
  }

  const multiOwner = [...byOwner.entries()].find(([, list]) => list.length >= 2)
  if (!multiOwner) {
    console.log('  · skipping multi-shop owner test (no user with 2+ shops)')
  } else {
    const [userId, userStores] = multiOwner
    const shopA = userStores[0]
    const shopB = userStores[1]

    const singleToken = await createConnection(admin, userId, {
      accessMode: 'single_shop',
      storeId: shopA.id,
      label: 'Test Single Shop',
    })

    const { res: listSingle, body: listSingleBody } = await agentFetch('/api/agent/v1/shops', singleToken)
    if (listSingle.status === 200 && listSingleBody.shops?.length === 1 && listSingleBody.shops[0].id === shopA.id) {
      ok('single_shop list_shops returns only bound shop')
    } else {
      fail('single_shop list_shops', JSON.stringify(listSingleBody))
    }

    const { res: slugDenied } = await agentFetch(`/api/agent/v1/shops/${shopB.id}`, singleToken)
    if (slugDenied.status === 403) ok('single_shop cannot access other managed shop by id')
    else fail('single_shop isolation by id', String(slugDenied.status))

    const allToken = await createConnection(admin, userId, {
      accessMode: 'all_managed_shops',
      storeId: null,
      label: 'Test All Shops',
    })

    const { res: listAll, body: listAllBody } = await agentFetch('/api/agent/v1/shops', allToken)
    const ids = (listAllBody.shops ?? []).map(s => s.id)
    if (listAll.status === 200 && ids.includes(shopA.id) && ids.includes(shopB.id)) {
      ok('all_managed_shops list_shops returns all managed shops')
    } else {
      fail('all_managed_shops list_shops', JSON.stringify(listAllBody))
    }

    const { res: shopBRes, body: shopBBody } = await agentFetch(`/api/agent/v1/shops/${shopB.id}?view=snapshot`, allToken)
    if (shopBRes.status === 200 && shopBBody.shop?.id === shopB.id) {
      ok('all_managed_shops get_shop_snapshot for second shop')
    } else {
      fail('all_managed_shops get_shop_snapshot', `${shopBRes.status}`)
    }
  }

  const ownerA = stores[0]
  const ownerB = stores.find(s => s.owner_user_id !== ownerA.owner_user_id) ?? stores[1]
  if (ownerB && ownerB.owner_user_id !== ownerA.owner_user_id) {
    const tokenA = await createConnection(admin, ownerA.owner_user_id, {
      accessMode: 'all_managed_shops',
      storeId: null,
      label: 'Cross-user test A',
    })
    const { res } = await agentFetch(`/api/agent/v1/shops/${ownerB.id}`, tokenA)
    if (res.status === 403) ok('all_managed_shops cannot access unrelated user shop')
    else fail('cross-user isolation', String(res.status))
  }

  const juiceShop = stores.find(s => s.slug === 'juiceandtoya')
  if (juiceShop) {
    let jordanUserId = juiceShop.owner_user_id
    if (JORDAN_EMAIL) {
      const { data: users } = await admin.auth.admin.listUsers()
      const match = users.users.find(u => u.email?.toLowerCase() === JORDAN_EMAIL.toLowerCase())
      if (match) jordanUserId = match.id
    }

    const jordanStores = stores.filter(s => s.owner_user_id === jordanUserId)
    if (jordanStores.length >= 2) {
      const jordanAllToken = await createConnection(admin, jordanUserId, {
        accessMode: 'all_managed_shops',
        storeId: null,
        label: 'Jordan All Shops Test',
      })

      const { res: jList, body: jListBody } = await agentFetch('/api/agent/v1/shops', jordanAllToken)
      const jIds = (jListBody.shops ?? []).map(s => s.id)
      if (jList.status === 200 && jIds.includes(juiceShop.id)) {
        ok('Jordan all_managed_shops list includes Juice & Toya')
      } else {
        fail('Jordan list_shops includes juiceandtoya', JSON.stringify(jListBody))
      }

      // MCP get_shop_by_slug is MCP-only; verify via shop id lookup path
      const { res: juiceSnap, body: juiceBody } = await agentFetch(
        `/api/agent/v1/shops/${juiceShop.id}?view=snapshot`,
        jordanAllToken,
      )
      if (juiceSnap.status === 200 && juiceBody.shop?.slug === 'juiceandtoya') {
        ok('Jordan can get_shop_snapshot for juiceandtoya')
      } else {
        fail('Jordan juiceandtoya snapshot', `${juiceSnap.status}`)
      }
    } else {
      console.log('  · Jordan multi-shop test skipped (user has <2 shops)')
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
