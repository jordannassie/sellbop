/**
 * Authoritative SellBop transaction fee calculations (integer cents only).
 */

import { calcCommissionCents } from '@/lib/affiliates'

export type SaleType = 'direct' | 'marketplace'

/** Direct: 10% + $0.50 (50 cents). Marketplace: 30%, no fixed fee. */
export const DIRECT_FEE_PERCENT = 10
export const DIRECT_FEE_FIXED_CENTS = 50
export const MARKETPLACE_FEE_PERCENT = 30

export interface FeeCalculationInput {
  grossAmountCents: number
  saleType: SaleType
  affiliateCommissionPercent?: number
}

export interface FeeCalculationResult {
  grossAmountCents: number
  saleType: SaleType
  sellbopPlatformFeeCents: number
  affiliateCommissionCents: number
  sellerNetCents: number
}

/** @deprecated Use calculateTransactionFees */
export function calcPlatformFeeCents(
  totalCents: number,
  saleType: SaleType = 'direct',
): number {
  return calculateTransactionFees({
    grossAmountCents: totalCents,
    saleType,
  }).sellbopPlatformFeeCents
}

/** @deprecated Use calculateTransactionFees */
export function calcSellerNetCents(
  totalCents: number,
  saleType: SaleType = 'direct',
  affiliateCommissionPercent = 0,
): number {
  return calculateTransactionFees({
    grossAmountCents: totalCents,
    saleType,
    affiliateCommissionPercent,
  }).sellerNetCents
}

export function calculateTransactionFees(
  input: FeeCalculationInput,
): FeeCalculationResult {
  const grossAmountCents = Math.max(0, Math.floor(input.grossAmountCents))
  const saleType = input.saleType
  const affiliateCommissionPercent = input.affiliateCommissionPercent ?? 0

  if (grossAmountCents === 0) {
    return {
      grossAmountCents: 0,
      saleType,
      sellbopPlatformFeeCents: 0,
      affiliateCommissionCents: 0,
      sellerNetCents: 0,
    }
  }

  let sellbopPlatformFeeCents: number
  if (saleType === 'marketplace') {
    sellbopPlatformFeeCents = Math.round(grossAmountCents * (MARKETPLACE_FEE_PERCENT / 100))
  } else {
    sellbopPlatformFeeCents =
      Math.round(grossAmountCents * (DIRECT_FEE_PERCENT / 100)) + DIRECT_FEE_FIXED_CENTS
  }

  // Never exceed the transaction amount (Stripe application_fee_amount must be valid).
  sellbopPlatformFeeCents = Math.min(sellbopPlatformFeeCents, grossAmountCents)

  const affiliateCommissionCents = affiliateCommissionPercent > 0
    ? calcCommissionCents(grossAmountCents, affiliateCommissionPercent)
    : 0

  const sellerNetCents = Math.max(0, grossAmountCents - sellbopPlatformFeeCents - affiliateCommissionCents)

  return {
    grossAmountCents,
    saleType,
    sellbopPlatformFeeCents,
    affiliateCommissionCents,
    sellerNetCents,
  }
}
