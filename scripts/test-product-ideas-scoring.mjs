#!/usr/bin/env node
/** Unit tests for Product Ideas scoring + trend (mirrors lib modules). */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function calculateTrend(monthlySearches) {
  if (!monthlySearches?.length || monthlySearches.length < 4) {
    return { trend: 'unknown', trendPercent: null }
  }
  const sorted = [...monthlySearches].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  )
  const recent = sorted.slice(-3)
  const previous = sorted.slice(-6, -3)
  if (previous.length < 3) return { trend: 'unknown', trendPercent: null }
  const recentAvg = recent.reduce((s, r) => s + r.search_volume, 0) / recent.length
  const prevAvg = previous.reduce((s, r) => s + r.search_volume, 0) / previous.length
  if (prevAvg === 0) return { trend: recentAvg > 0 ? 'rising' : 'stable', trendPercent: recentAvg > 0 ? 100 : 0 }
  const pct = ((recentAvg - prevAvg) / prevAvg) * 100
  let trend = 'stable'
  if (pct > 10) trend = 'rising'
  else if (pct < -10) trend = 'falling'
  return { trend, trendPercent: Math.round(pct * 10) / 10 }
}

function calculateOpportunityScore(input) {
  if (input.searchVolume == null || input.searchVolume <= 0) return null
  const demand = clamp((Math.log10(input.searchVolume + 1) / 5) * 100) * 0.4
  const trendMap = { rising: 100, stable: 60, falling: 25, unknown: 50 }
  const trend = trendMap[input.trend] * 0.3
  const intent = clamp(((input.cpc ?? 0) / 5) * 100) * 0.15
  const competition = clamp((1 - (input.competition ?? 0.5)) * 100) * 0.15
  return Math.round(clamp(demand + trend + intent + competition))
}

let passed = 0
let failed = 0
function ok(label) { console.log(`  ✓ ${label}`); passed++ }
function assert(label, cond) { if (cond) ok(label); else { console.log(`  ✗ ${label}`); failed++ } }

const risingHistory = [
  { year: 2025, month: 1, search_volume: 1000 },
  { year: 2025, month: 2, search_volume: 1000 },
  { year: 2025, month: 3, search_volume: 1000 },
  { year: 2025, month: 4, search_volume: 1500 },
  { year: 2025, month: 5, search_volume: 1500 },
  { year: 2025, month: 6, search_volume: 1500 },
]
assert('rising trend', calculateTrend(risingHistory).trend === 'rising')
assert('score with volume', calculateOpportunityScore({ searchVolume: 10000, cpc: 2, competition: 0.3, trend: 'rising' }) > 50)
assert('null score without volume', calculateOpportunityScore({ searchVolume: null, cpc: 2, competition: 0.3, trend: 'rising' }) === null)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
