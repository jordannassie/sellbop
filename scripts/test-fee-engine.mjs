#!/usr/bin/env node
/**
 * Fee engine unit tests (no test runner required).
 * Run: node scripts/test-fee-engine.mjs
 */

const DIRECT_FEE_PERCENT = 10
const DIRECT_FEE_FIXED_CENTS = 50
const MARKETPLACE_FEE_PERCENT = 30

function calcCommissionCents(grossCents, percent) {
  return Math.floor(grossCents * (percent / 100))
}

function calculateTransactionFees({ grossAmountCents, saleType, affiliateCommissionPercent = 0 }) {
  const gross = Math.max(0, Math.floor(grossAmountCents))
  if (gross === 0) {
    return { grossAmountCents: 0, saleType, sellbopPlatformFeeCents: 0, affiliateCommissionCents: 0, sellerNetCents: 0 }
  }
  let fee = saleType === 'marketplace'
    ? Math.round(gross * (MARKETPLACE_FEE_PERCENT / 100))
    : Math.round(gross * (DIRECT_FEE_PERCENT / 100)) + DIRECT_FEE_FIXED_CENTS
  fee = Math.min(fee, gross)
  const affiliate = affiliateCommissionPercent > 0 ? calcCommissionCents(gross, affiliateCommissionPercent) : 0
  const sellerNet = Math.max(0, gross - fee - affiliate)
  return { grossAmountCents: gross, saleType, sellbopPlatformFeeCents: fee, affiliateCommissionCents: affiliate, sellerNetCents: sellerNet }
}

function assert(name, condition) {
  if (!condition) {
    console.error(`✗ ${name}`)
    process.exitCode = 1
    return false
  }
  console.log(`✓ ${name}`)
  return true
}

// Direct $1
let r = calculateTransactionFees({ grossAmountCents: 100, saleType: 'direct' })
assert('Direct $1 platform fee = 60¢', r.sellbopPlatformFeeCents === 60)
assert('Direct $1 seller net = 40¢', r.sellerNetCents === 40)

// Direct $37
r = calculateTransactionFees({ grossAmountCents: 3700, saleType: 'direct' })
assert('Direct $37 platform fee = $4.20', r.sellbopPlatformFeeCents === 420)
assert('Direct $37 seller net = $32.80', r.sellerNetCents === 3280)

// Marketplace $37
r = calculateTransactionFees({ grossAmountCents: 3700, saleType: 'marketplace' })
assert('Marketplace $37 platform fee = $11.10', r.sellbopPlatformFeeCents === 1110)
assert('Marketplace $37 seller net = $25.90', r.sellerNetCents === 2590)

// Discount scenario ($50 list, $37 paid)
r = calculateTransactionFees({ grossAmountCents: 3700, saleType: 'direct' })
assert('Fee on discounted $37 (not list price)', r.sellbopPlatformFeeCents === 420)

// Affiliate on direct $50 @ 30%
r = calculateTransactionFees({ grossAmountCents: 5000, saleType: 'direct', affiliateCommissionPercent: 30 })
assert('Affiliate 30% of $50 = $15', r.affiliateCommissionCents === 1500)
assert('Direct $50 fee = $5.50', r.sellbopPlatformFeeCents === 550)
assert('Direct $50 seller net after fee+affiliate = $29.50', r.sellerNetCents === 2950)

// Free product
r = calculateTransactionFees({ grossAmountCents: 0, saleType: 'direct' })
assert('Free product: zero fees', r.sellbopPlatformFeeCents === 0)

// Very low amount — fee capped at gross
r = calculateTransactionFees({ grossAmountCents: 40, saleType: 'direct' })
assert('40¢ direct fee capped at 40¢', r.sellbopPlatformFeeCents === 40)

// Marketplace no fixed fee
r = calculateTransactionFees({ grossAmountCents: 100, saleType: 'marketplace' })
assert('Marketplace $1 fee = 30¢ (no $0.50)', r.sellbopPlatformFeeCents === 30)

// Rounding
r = calculateTransactionFees({ grossAmountCents: 999, saleType: 'direct' })
assert('Direct $9.99 fee rounds correctly', r.sellbopPlatformFeeCents === Math.min(150, 999))

if (process.exitCode) {
  console.error('\nFee engine tests FAILED')
  process.exit(1)
}
console.log('\nAll fee engine tests passed.')
