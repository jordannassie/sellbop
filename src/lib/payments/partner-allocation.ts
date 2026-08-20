/**
 * Partner Shop revenue allocation (integer cents, basis points).
 * Normal SellBop shops use fee-engine.ts — not this module.
 */

export const DEFAULT_PARTNER_SHARE_BPS = 5000 // 50%
export const BPS_DENOMINATOR = 10000

export interface PartnerAllocationInput {
  saleSubtotalCents: number
  discountCents?: number
  taxCents?: number
  affiliateCommissionCents: number
  stripeFeeCents: number | null
  partnerShareBps: number
}

export interface PartnerAllocationResult {
  saleSubtotalCents: number
  discountCents: number
  taxCents: number
  affiliateCommissionCents: number
  stripeFeeCents: number | null
  netDistributableCents: number
  partnerShareBps: number
  partnerShareCents: number
  sellbopShareCents: number
  reconciles: boolean
  awaitingStripeFee: boolean
}

export function validatePartnerShareBps(bps: number): boolean {
  return Number.isInteger(bps) && bps >= 0 && bps <= BPS_DENOMINATOR
}

export function sellbopShareBps(partnerShareBps: number): number {
  return BPS_DENOMINATOR - partnerShareBps
}

/** Authoritative net-split allocation for Partner Shops. */
export function calculatePartnerAllocation(input: PartnerAllocationInput): PartnerAllocationResult {
  const saleSubtotalCents = Math.max(0, Math.floor(input.saleSubtotalCents))
  const discountCents = Math.max(0, Math.floor(input.discountCents ?? 0))
  const taxCents = Math.max(0, Math.floor(input.taxCents ?? 0))
  const affiliateCommissionCents = Math.max(0, Math.floor(input.affiliateCommissionCents))
  const partnerShareBps = Math.min(BPS_DENOMINATOR, Math.max(0, Math.floor(input.partnerShareBps)))
  const stripeFeeCents = input.stripeFeeCents === null
    ? null
    : Math.max(0, Math.floor(input.stripeFeeCents))

  const awaitingStripeFee = stripeFeeCents === null

  const netDistributableCents = Math.max(
    0,
    saleSubtotalCents - affiliateCommissionCents - (stripeFeeCents ?? 0),
  )

  const partnerShareCents = Math.floor(netDistributableCents * partnerShareBps / BPS_DENOMINATOR)
  const sellbopShareCents = netDistributableCents - partnerShareCents

  const reconciles = stripeFeeCents === null
    ? true
    : (
      stripeFeeCents
      + affiliateCommissionCents
      + partnerShareCents
      + sellbopShareCents
      === saleSubtotalCents
    )

  return {
    saleSubtotalCents,
    discountCents,
    taxCents,
    affiliateCommissionCents,
    stripeFeeCents,
    netDistributableCents,
    partnerShareBps,
    partnerShareCents,
    sellbopShareCents,
    reconciles,
    awaitingStripeFee,
  }
}

/** Proportional reversal for partial refunds against original allocation. */
export function calculatePartialRefundReversal(input: {
  original: Pick<PartnerAllocationResult, 'saleSubtotalCents' | 'affiliateCommissionCents' | 'stripeFeeCents' | 'partnerShareCents' | 'sellbopShareCents'>
  refundCents: number
}): {
  refundCents: number
  affiliateReversalCents: number
  partnerReversalCents: number
  sellbopReversalCents: number
  stripeFeeReversalCents: number
} {
  const refundCents = Math.max(0, Math.min(input.refundCents, input.original.saleSubtotalCents))
  if (refundCents === 0 || input.original.saleSubtotalCents === 0) {
    return {
      refundCents: 0,
      affiliateReversalCents: 0,
      partnerReversalCents: 0,
      sellbopReversalCents: 0,
      stripeFeeReversalCents: 0,
    }
  }

  const ratio = refundCents / input.original.saleSubtotalCents
  const affiliateReversalCents = Math.floor(input.original.affiliateCommissionCents * ratio)
  const stripeFeeReversalCents = input.original.stripeFeeCents === null
    ? 0
    : Math.floor(input.original.stripeFeeCents * ratio)
  const partnerReversalCents = Math.floor(input.original.partnerShareCents * ratio)
  const sellbopReversalCents = refundCents - affiliateReversalCents - stripeFeeReversalCents - partnerReversalCents

  return {
    refundCents,
    affiliateReversalCents,
    partnerReversalCents,
    sellbopReversalCents: Math.max(0, sellbopReversalCents),
    stripeFeeReversalCents,
  }
}

export function transferGroupForOrder(orderId: string): string {
  return `SB_ORDER_${orderId}`
}

export function partnerTransferIdempotencyKey(orderId: string): string {
  return `partner-transfer:${orderId}:v1`
}

export function partnerReversalIdempotencyKey(orderId: string, refundId: string): string {
  return `partner-reversal:${orderId}:${refundId}:v1`
}
