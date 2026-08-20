#!/usr/bin/env node
/** Unit tests for OAuth access-mode scope encoding (mirrors oauth-access-scope.ts). */

const PREFIX = 'sellbop:access:'
const ALL_AGENT_SCOPES = [
  'shops:read', 'shops:write', 'products:read', 'products:write',
  'files:write', 'affiliates:write', 'analytics:read', 'sales:read',
]

function encodeAccessModeScope(access) {
  if (access.accessMode === 'all_managed_shops') {
    return `${PREFIX}all_managed_shops`
  }
  return `${PREFIX}single_shop:${access.storeId ?? 'none'}`
}

function parseAccessFromScope(scope) {
  if (!scope) return null
  for (const part of scope.split(/\s+/)) {
    if (part === `${PREFIX}all_managed_shops`) {
      return { accessMode: 'all_managed_shops', storeId: null }
    }
    const singlePrefix = `${PREFIX}single_shop:`
    if (part.startsWith(singlePrefix)) {
      const rawStoreId = part.slice(singlePrefix.length)
      return { accessMode: 'single_shop', storeId: rawStoreId === 'none' ? null : rawStoreId }
    }
  }
  return null
}

function filterAgentScopes(scope) {
  return (scope?.split(/\s+/) ?? []).filter(part =>
    !part.startsWith(PREFIX) && ALL_AGENT_SCOPES.includes(part),
  )
}

function withAccessModeScope(scope, access) {
  return [...filterAgentScopes(scope), encodeAccessModeScope(access)].join(' ')
}

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function assert(label, cond, detail = '') {
  if (cond) ok(label)
  else {
    console.log(`  ✗ ${label}${detail ? `: ${detail}` : ''}`)
    failed++
  }
}

const storeId = '8d0b2d79-1111-2222-3333-444444444444'
const baseScope = 'shops:read shops:write products:read'

const allScope = withAccessModeScope(baseScope, { accessMode: 'all_managed_shops', storeId: null })
assert('encodes all_managed_shops tag', allScope.includes(`${PREFIX}all_managed_shops`))
assert('preserves agent scopes', filterAgentScopes(allScope).length === 3)
assert('parses all_managed_shops', parseAccessFromScope(allScope)?.accessMode === 'all_managed_shops')

const singleScope = withAccessModeScope(baseScope, { accessMode: 'single_shop', storeId })
assert('encodes single_shop store id', singleScope.includes(`${PREFIX}single_shop:${storeId}`))
assert('parses single_shop store id', parseAccessFromScope(singleScope)?.storeId === storeId)

const replaced = withAccessModeScope(allScope, { accessMode: 'single_shop', storeId: null })
assert('replaces prior access tag', !replaced.includes(`${PREFIX}all_managed_shops`))
assert('single_shop none when no store', parseAccessFromScope(replaced)?.storeId === null)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
