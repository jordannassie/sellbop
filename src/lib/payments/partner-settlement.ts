import 'server-only'

import type Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import {
  calculatePartnerAllocation,
  calculatePartialRefundReversal,
  partnerReversalIdempotencyKey,
  partnerTransferIdempotencyKey,
  transferGroupForOrder,
} from '@/lib/payments/partner-allocation'
import { calcCommissionCents } from '@/lib/affiliates'

export class PartnerSettlementError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export interface CreatePartnerSnapshotInput {
  orderId: string
  storeId: string
  partnershipId: string
  financialTermsId: string
  partnerShareBps: number
  financialModel: string
  saleSubtotalCents: number
  discountCents?: number
  taxCents?: number
  affiliateCommissionCents: number
  stripeFeeCents: number | null
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  stripeChargeId?: string | null
  stripeBalanceTransactionId?: string | null
  currency?: string
}

async function insertLedgerEntry(params: {
  orderId: string
  orderFinancialId: string
  storeId: string
  partnershipId: string
  partyType: 'partner' | 'sellbop' | 'affiliate' | 'stripe'
  partyUserId?: string | null
  entryType: string
  amountCents: number
  currency?: string
  stripeObjectId?: string | null
  reference?: string | null
  metadata?: Record<string, unknown>
}) {
  const admin = getSupabaseAdminClient()
  await admin.from('financial_ledger_entries').insert({
    order_id: params.orderId,
    order_financial_id: params.orderFinancialId,
    store_id: params.storeId,
    partnership_id: params.partnershipId,
    party_type: params.partyType,
    party_user_id: params.partyUserId ?? null,
    entry_type: params.entryType,
    amount_cents: params.amountCents,
    currency: params.currency ?? 'usd',
    stripe_object_id: params.stripeObjectId ?? null,
    reference: params.reference ?? null,
    metadata: (params.metadata ?? null) as Record<string, unknown> | null,
  })
}

/** Idempotent financial snapshot + ledger for a Partner Shop order. */
export async function createPartnerFinancialSnapshot(input: CreatePartnerSnapshotInput) {
  const admin = getSupabaseAdminClient()

  const { data: existing } = await admin
    .from('order_financials')
    .select('id, settlement_status')
    .eq('order_id', input.orderId)
    .maybeSingle()

  if (existing) return existing

  const allocation = calculatePartnerAllocation({
    saleSubtotalCents: input.saleSubtotalCents,
    discountCents: input.discountCents,
    taxCents: input.taxCents,
    affiliateCommissionCents: input.affiliateCommissionCents,
    stripeFeeCents: input.stripeFeeCents,
    partnerShareBps: input.partnerShareBps,
  })

  if (!allocation.reconciles && input.stripeFeeCents !== null) {
    console.error('[createPartnerFinancialSnapshot] reconciliation failed', input.orderId, allocation)
    throw new PartnerSettlementError('Financial snapshot does not reconcile.', 500)
  }

  const settlementStatus = allocation.awaitingStripeFee ? 'awaiting_processing_fee' : 'ready'
  const transferGroup = transferGroupForOrder(input.orderId)

  const { data: row, error } = await admin
    .from('order_financials')
    .insert({
      order_id: input.orderId,
      store_id: input.storeId,
      partnership_id: input.partnershipId,
      financial_terms_id: input.financialTermsId,
      financial_model: input.financialModel,
      currency: input.currency ?? 'usd',
      sale_subtotal_cents: allocation.saleSubtotalCents,
      tax_cents: allocation.taxCents,
      discount_cents: allocation.discountCents,
      stripe_fee_cents: allocation.stripeFeeCents,
      affiliate_commission_cents: allocation.affiliateCommissionCents,
      net_distributable_cents: allocation.netDistributableCents,
      partner_share_bps: allocation.partnerShareBps,
      partner_share_cents: allocation.partnerShareCents,
      sellbop_share_cents: allocation.sellbopShareCents,
      transfer_group: transferGroup,
      stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      stripe_charge_id: input.stripeChargeId ?? null,
      stripe_balance_transaction_id: input.stripeBalanceTransactionId ?? null,
      settlement_status: settlementStatus,
      reconciliation_status: allocation.reconciles ? 'balanced' : 'reconciliation_required',
    })
    .select('id, settlement_status, partner_share_cents, stripe_charge_id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: dup } = await admin.from('order_financials').select('id').eq('order_id', input.orderId).maybeSingle()
      return dup
    }
    throw error
  }

  const financialId = row.id

  await insertLedgerEntry({
    orderId: input.orderId,
    orderFinancialId: financialId,
    storeId: input.storeId,
    partnershipId: input.partnershipId,
    partyType: 'stripe',
    entryType: 'stripe_processing_fee',
    amountCents: allocation.stripeFeeCents ?? 0,
    stripeObjectId: input.stripeBalanceTransactionId ?? input.stripeChargeId ?? null,
  })

  if (allocation.affiliateCommissionCents > 0) {
    await insertLedgerEntry({
      orderId: input.orderId,
      orderFinancialId: financialId,
      storeId: input.storeId,
      partnershipId: input.partnershipId,
      partyType: 'affiliate',
      entryType: 'affiliate_commission',
      amountCents: allocation.affiliateCommissionCents,
    })
  }

  await insertLedgerEntry({
    orderId: input.orderId,
    orderFinancialId: financialId,
    storeId: input.storeId,
    partnershipId: input.partnershipId,
    partyType: 'partner',
    entryType: 'partner_earning',
    amountCents: allocation.partnerShareCents,
  })

  await insertLedgerEntry({
    orderId: input.orderId,
    orderFinancialId: financialId,
    storeId: input.storeId,
    partnershipId: input.partnershipId,
    partyType: 'sellbop',
    entryType: 'sellbop_earning',
    amountCents: allocation.sellbopShareCents,
  })

  return row
}

export async function resolveStripeFeeFromCharge(stripe: Stripe, chargeId: string): Promise<number | null> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] })
    const bt = charge.balance_transaction
    if (typeof bt === 'object' && bt?.fee != null) return bt.fee
    if (typeof bt === 'string') {
      const txn = await stripe.balanceTransactions.retrieve(bt)
      return txn.fee ?? null
    }
    return charge.application_fee_amount != null ? null : null
  } catch (err) {
    console.error('[resolveStripeFeeFromCharge]', chargeId, err)
    return null
  }
}

/** Create Stripe Transfer to Partner connected account (separate charges & transfers model). */
export async function createPartnerTransfer(params: {
  orderId: string
  orderFinancialId: string
  partnershipId: string
  storeId: string
  partnerUserId: string
  amountCents: number
  currency?: string
  destinationStripeAccountId: string
  sourceTransactionId?: string | null
}) {
  if (!env.stripe.secretKey) throw new PartnerSettlementError('Stripe not configured.', 503)
  if (params.amountCents <= 0) return null

  const admin = getSupabaseAdminClient()
  const idempotencyKey = partnerTransferIdempotencyKey(params.orderId)

  const { data: existingTransfer } = await admin
    .from('partner_transfers')
    .select('*')
    .eq('order_financial_id', params.orderFinancialId)
    .maybeSingle()

  if (existingTransfer?.stripe_transfer_id) return existingTransfer

  const { data: transferRow, error: insertErr } = await admin
    .from('partner_transfers')
    .insert({
      order_financial_id: params.orderFinancialId,
      partnership_id: params.partnershipId,
      store_id: params.storeId,
      partner_user_id: params.partnerUserId,
      amount_cents: params.amountCents,
      currency: params.currency ?? 'usd',
      status: 'transfer_pending',
      idempotency_key: idempotencyKey,
    })
    .select('*')
    .single()

  if (insertErr) {
    if (insertErr.code === '23505') {
      const { data: dup } = await admin.from('partner_transfers').select('*').eq('order_financial_id', params.orderFinancialId).maybeSingle()
      return dup
    }
    throw insertErr
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(env.stripe.secretKey)

  try {
    const transfer = await stripe.transfers.create({
      amount: params.amountCents,
      currency: params.currency ?? 'usd',
      destination: params.destinationStripeAccountId,
      transfer_group: transferGroupForOrder(params.orderId),
      ...(params.sourceTransactionId ? { source_transaction: params.sourceTransactionId } : {}),
      metadata: {
        sellbop_order_id: params.orderId,
        sellbop_store_id: params.storeId,
        sellbop_partnership_id: params.partnershipId,
      },
    }, { idempotencyKey })

    await admin.from('partner_transfers').update({
      stripe_transfer_id: transfer.id,
      status: 'transferred',
      updated_at: new Date().toISOString(),
    }).eq('id', transferRow.id)

    await admin.from('order_financials').update({
      settlement_status: 'transferred',
      updated_at: new Date().toISOString(),
    }).eq('id', params.orderFinancialId)

    await insertLedgerEntry({
      orderId: params.orderId,
      orderFinancialId: params.orderFinancialId,
      storeId: params.storeId,
      partnershipId: params.partnershipId,
      partyType: 'partner',
      partyUserId: params.partnerUserId,
      entryType: 'transfer',
      amountCents: params.amountCents,
      stripeObjectId: transfer.id,
      reference: idempotencyKey,
    })

    return { ...transferRow, stripe_transfer_id: transfer.id, status: 'transferred' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transfer failed'
    await admin.from('partner_transfers').update({
      status: 'failed',
      failure_message: message,
      updated_at: new Date().toISOString(),
    }).eq('id', transferRow.id)
    await admin.from('order_financials').update({
      settlement_status: 'failed',
      reconciliation_status: 'reconciliation_required',
      updated_at: new Date().toISOString(),
    }).eq('id', params.orderFinancialId)
    throw err
  }
}

/** Full settlement pipeline after order fulfillment for Partner Shops. */
export async function settlePartnerOrder(orderId: string) {
  const admin = getSupabaseAdminClient()

  const { data: financial } = await admin
    .from('order_financials')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (!financial) return null
  if (financial.settlement_status === 'transferred') return financial

  let stripeFeeCents = financial.stripe_fee_cents
  if (stripeFeeCents === null && financial.stripe_charge_id && env.stripe.secretKey) {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(env.stripe.secretKey)
    stripeFeeCents = await resolveStripeFeeFromCharge(stripe, financial.stripe_charge_id as string)
    if (stripeFeeCents !== null) {
      const allocation = calculatePartnerAllocation({
        saleSubtotalCents: financial.sale_subtotal_cents,
        discountCents: financial.discount_cents,
        taxCents: financial.tax_cents,
        affiliateCommissionCents: financial.affiliate_commission_cents,
        stripeFeeCents,
        partnerShareBps: financial.partner_share_bps,
      })
      if (!allocation.reconciles) {
        await admin.from('order_financials').update({
          reconciliation_status: 'reconciliation_required',
          settlement_status: 'reconciliation_required',
          updated_at: new Date().toISOString(),
        }).eq('id', financial.id)
        return financial
      }
      await admin.from('order_financials').update({
        stripe_fee_cents: stripeFeeCents,
        net_distributable_cents: allocation.netDistributableCents,
        partner_share_cents: allocation.partnerShareCents,
        sellbop_share_cents: allocation.sellbopShareCents,
        settlement_status: 'ready',
        reconciliation_status: 'balanced',
        updated_at: new Date().toISOString(),
      }).eq('id', financial.id)
      financial.partner_share_cents = allocation.partnerShareCents
    } else {
      return financial
    }
  }

  if (financial.settlement_status === 'awaiting_processing_fee' && stripeFeeCents === null) {
    return financial
  }

  const { data: partnership } = await admin
    .from('store_partnerships')
    .select('partner_user_id, store_id')
    .eq('id', financial.partnership_id)
    .maybeSingle()

  const { data: store } = await admin
    .from('stores')
    .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled')
    .eq('id', financial.store_id)
    .maybeSingle()

  const partnerUserId = partnership?.partner_user_id
  const stripeAccountId = store?.stripe_account_id
  if (!partnerUserId || !stripeAccountId) {
    await admin.from('order_financials').update({
      settlement_status: 'reconciliation_required',
      updated_at: new Date().toISOString(),
    }).eq('id', financial.id)
    return financial
  }

  return createPartnerTransfer({
    orderId,
    orderFinancialId: financial.id,
    partnershipId: financial.partnership_id,
    storeId: financial.store_id,
    partnerUserId,
    amountCents: financial.partner_share_cents,
    currency: financial.currency,
    destinationStripeAccountId: stripeAccountId,
    sourceTransactionId: financial.stripe_charge_id as string | null,
  })
}

export async function processPartnerRefund(params: {
  orderId: string
  refundCents: number
  stripeRefundId?: string | null
  isFullRefund: boolean
}) {
  const admin = getSupabaseAdminClient()
  const { data: financial } = await admin
    .from('order_financials')
    .select('*')
    .eq('order_id', params.orderId)
    .maybeSingle()

  if (!financial) return null

  const reversal = calculatePartialRefundReversal({
    original: {
      saleSubtotalCents: financial.sale_subtotal_cents,
      affiliateCommissionCents: financial.affiliate_commission_cents,
      stripeFeeCents: financial.stripe_fee_cents,
      partnerShareCents: financial.partner_share_cents,
      sellbopShareCents: financial.sellbop_share_cents,
    },
    refundCents: params.refundCents,
  })

  await insertLedgerEntry({
    orderId: params.orderId,
    orderFinancialId: financial.id,
    storeId: financial.store_id,
    partnershipId: financial.partnership_id,
    partyType: 'partner',
    entryType: 'refund',
    amountCents: -reversal.partnerReversalCents,
    stripeObjectId: params.stripeRefundId ?? null,
  })

  const { data: transfer } = await admin
    .from('partner_transfers')
    .select('*')
    .eq('order_financial_id', financial.id)
    .maybeSingle()

  if (transfer?.stripe_transfer_id && reversal.partnerReversalCents > 0 && env.stripe.secretKey) {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(env.stripe.secretKey)
    const refundId = params.stripeRefundId ?? 'manual'
    const idempotencyKey = partnerReversalIdempotencyKey(params.orderId, refundId)
    try {
      await stripe.transfers.createReversal(transfer.stripe_transfer_id, {
        amount: Math.min(reversal.partnerReversalCents, transfer.amount_cents),
      }, { idempotencyKey })
      await admin.from('partner_transfers').update({
        status: params.isFullRefund ? 'reversed' : 'partially_reversed',
        updated_at: new Date().toISOString(),
      }).eq('id', transfer.id)
    } catch (err) {
      console.error('[processPartnerRefund] reversal failed', params.orderId, err)
      await admin.from('partner_transfers').update({
        status: 'reconciliation_required',
        failure_message: err instanceof Error ? err.message : 'Reversal failed',
        updated_at: new Date().toISOString(),
      }).eq('id', transfer.id)
    }
  }

  await admin.from('order_financials').update({
    settlement_status: params.isFullRefund ? 'refunded' : 'partially_refunded',
    updated_at: new Date().toISOString(),
  }).eq('id', financial.id)

  return reversal
}

/** Affiliate commission for partner checkout — uses existing calcCommissionCents. */
export function partnerAffiliateCommissionCents(grossCents: number, percent: number): number {
  return calcCommissionCents(grossCents, percent)
}
