#!/usr/bin/env node
/** Run: node scripts/test-partner-allocation.mjs */

const BPS = 10000

function calculatePartnerAllocation(input) {
  const saleSubtotalCents = Math.max(0, Math.floor(input.saleSubtotalCents))
  const affiliateCommissionCents = Math.max(0, Math.floor(input.affiliateCommissionCents))
  const partnerShareBps = Math.min(BPS, Math.max(0, Math.floor(input.partnerShareBps)))
  const stripeFeeCents = input.stripeFeeCents === null ? null : Math.max(0, Math.floor(input.stripeFeeCents))
  const netDistributableCents = Math.max(0, saleSubtotalCents - affiliateCommissionCents - (stripeFeeCents ?? 0))
  const partnerShareCents = Math.floor(netDistributableCents * partnerShareBps / BPS)
  const sellbopShareCents = netDistributableCents - partnerShareCents
  const reconciles = stripeFeeCents === null || (
    stripeFeeCents + affiliateCommissionCents + partnerShareCents + sellbopShareCents === saleSubtotalCents
  )
  return { saleSubtotalCents, affiliateCommissionCents, stripeFeeCents, netDistributableCents, partnerShareCents, sellbopShareCents, reconciles, awaitingStripeFee: stripeFeeCents === null }
}

function calculatePartialRefundReversal(input) {
  const refundCents = Math.max(0, Math.min(input.refundCents, input.original.saleSubtotalCents))
  if (refundCents === 0) return { refundCents: 0, affiliateReversalCents: 0, partnerReversalCents: 0, sellbopReversalCents: 0, stripeFeeReversalCents: 0 }
  const ratio = refundCents / input.original.saleSubtotalCents
  const affiliateReversalCents = Math.floor(input.original.affiliateCommissionCents * ratio)
  const stripeFeeReversalCents = input.original.stripeFeeCents === null ? 0 : Math.floor(input.original.stripeFeeCents * ratio)
  const partnerReversalCents = Math.floor(input.original.partnerShareCents * ratio)
  const sellbopReversalCents = refundCents - affiliateReversalCents - stripeFeeReversalCents - partnerReversalCents
  return { refundCents, affiliateReversalCents, partnerReversalCents, sellbopReversalCents: Math.max(0, sellbopReversalCents), stripeFeeReversalCents }
}

let passed = 0
let failed = 0
function assert(name, ok) { if (ok) { passed++; console.log(`✓ ${name}`) } else { failed++; console.error(`✗ ${name}`) } }

{
  const r = calculatePartnerAllocation({ saleSubtotalCents: 10000, affiliateCommissionCents: 0, stripeFeeCents: 320, partnerShareBps: 5000 })
  assert('100 no-affiliate reconciles', r.reconciles)
  assert('partner 4840', r.partnerShareCents === 4840)
}

{
  const r = calculatePartnerAllocation({ saleSubtotalCents: 10000, affiliateCommissionCents: 2000, stripeFeeCents: 320, partnerShareBps: 5000 })
  assert('affiliate example reconciles', r.reconciles)
  assert('partner 3840', r.partnerShareCents === 3840)
  assert('sellbop 3840', r.sellbopShareCents === 3840)
}

{
  const r = calculatePartnerAllocation({ saleSubtotalCents: 1999, affiliateCommissionCents: 0, stripeFeeCents: 88, partnerShareBps: 5000 })
  assert('$19.99 reconciles', r.reconciles)
  assert('no lost cents', r.partnerShareCents + r.sellbopShareCents + r.affiliateCommissionCents + r.stripeFeeCents === 1999)
}

{
  const r = calculatePartnerAllocation({ saleSubtotalCents: 10000, affiliateCommissionCents: 0, stripeFeeCents: 300, partnerShareBps: 6000 })
  assert('60% partner', r.partnerShareCents === Math.floor(9700 * 6000 / 10000))
}

{
  const r = calculatePartnerAllocation({ saleSubtotalCents: 5000, affiliateCommissionCents: 0, stripeFeeCents: null, partnerShareBps: 5000 })
  assert('awaiting stripe fee', r.awaitingStripeFee)
}

{
  const original = calculatePartnerAllocation({ saleSubtotalCents: 10000, affiliateCommissionCents: 2000, stripeFeeCents: 320, partnerShareBps: 5000 })
  const rev = calculatePartialRefundReversal({ original, refundCents: 5000 })
  assert('partial refund sums', rev.affiliateReversalCents + rev.partnerReversalCents + rev.sellbopReversalCents + rev.stripeFeeReversalCents === 5000)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
