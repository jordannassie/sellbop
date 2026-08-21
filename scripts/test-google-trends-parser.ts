import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  findVerifiedTrendItem,
  parseGoogleTrendsRss,
  parseTrafficLabel,
  trendActivityScore,
  calculateGoogleTrendsOpportunityScore,
} from '../src/lib/product-ideas/google-trends-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = readFileSync(join(__dirname, 'fixtures/google-trends-rss.xml'), 'utf8')

let passed = 0
let failed = 0
function ok(label: string) { console.log(`  ✓ ${label}`); passed++ }
function assert(label: string, cond: boolean) { if (cond) ok(label); else { console.log(`  ✗ ${label}`); failed++ } }

const items = parseGoogleTrendsRss(fixture)
assert('parses fixture items', items.length >= 2)
assert('first query', items[0]?.query === 'cortisol blueprint')
assert('traffic label preserved', items[0]?.trafficLabel === '20K+')
assert('traffic approx 20K', items[0]?.trafficApprox === 20000)
assert('related titles', (items[0]?.relatedTitles.length ?? 0) >= 1)

const t200 = parseTrafficLabel('200+')
assert('200+ approx', t200.trafficApprox === 200)
const t2k = parseTrafficLabel('2K+')
assert('2K+ approx', t2k.trafficApprox === 2000)
const t1m = parseTrafficLabel('1M+')
assert('1M+ approx', t1m.trafficApprox === 1000000)
assert('malformed traffic', parseTrafficLabel('n/a').trafficApprox === null)

assert('empty xml', parseGoogleTrendsRss('').length === 0)
assert('no items xml', parseGoogleTrendsRss('<rss><channel></channel></rss>').length === 0)

assert('activity 20K tier', trendActivityScore(20000) >= 70)
assert('unknown trend downgraded', findVerifiedTrendItem(items, 'totally fake trend') === null)
assert('exact trend match', findVerifiedTrendItem(items, 'cortisol blueprint')?.query === 'cortisol blueprint')

const score = calculateGoogleTrendsOpportunityScore({
  trafficApprox: 20000,
  publishedAt: new Date().toISOString(),
  productFitScore: 85,
  evergreenScore: 80,
})
assert('opportunity score range', score >= 50 && score <= 100)

assert('fake trend query rejected', findVerifiedTrendItem(items, 'celebrity scandal xyz') === null)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
