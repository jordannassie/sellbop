import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

type OrderFinancial = Database['public']['Tables']['order_financials']['Row']
type PartnerTransfer = Database['public']['Tables']['partner_transfers']['Row']

export interface PartnerEarningsSummary {
  grossSalesCents: number
  partnerEarningsCents: number
  pendingCents: number
  transferredCents: number
  refundsAdjustmentsCents: number
  orderCount: number
}

export interface PartnerOrderFinancialRow {
  orderId: string
  createdAt: string
  productTitle: string | null
  grossCents: number
  affiliateCents: number
  stripeFeeCents: number | null
  netCents: number
  partnerShareCents: number
  status: string
  statusLabel: string
  stripeTransferId: string | null
  needsReview: boolean
}

export interface PartnershipFinancialSummary extends PartnerEarningsSummary {
  affiliateCommissionsCents: number
  stripeFeesCents: number
  sellbopRevenueCents: number
  reconciliationRequiredCount: number
}

export interface PlatformFinancialSummary {
  partnerShopGrossCents: number
  partnerEarningsCents: number
  sellbopPartnerRevenueCents: number
  affiliateCommissionsCents: number
  stripeFeesCents: number
  refundsCents: number
  pendingTransfersCents: number
  failedTransfersCount: number
  reconciliationRequiredCount: number
  normalShopPlatformFeeCents: number
}

const TRANSFERRED_STATUSES = new Set(['transferred'])
const PENDING_STATUSES = new Set(['pending', 'awaiting_processing_fee', 'ready', 'transfer_pending'])
const REFUND_STATUSES = new Set(['refunded', 'partially_refunded'])
const NEEDS_REVIEW_STATUSES = new Set(['failed', 'reconciliation_required'])
const NEEDS_REVIEW_RECON = new Set(['reconciliation_required'])

export function formatSettlementStatusLabel(status: string, transferStatus?: string | null): string {
  if (NEEDS_REVIEW_STATUSES.has(status) || transferStatus === 'reconciliation_required' || transferStatus === 'failed') {
    return 'Needs Review'
  }
  if (REFUND_STATUSES.has(status)) {
    return status === 'refunded' ? 'Refunded' : 'Partially Refunded'
  }
  if (transferStatus === 'transfer_pending' || status === 'transfer_pending') return 'Transferring'
  if (TRANSFERRED_STATUSES.has(status) || transferStatus === 'transferred') return 'Transferred'
  if (status === 'ready') return 'Ready'
  if (PENDING_STATUSES.has(status)) return 'Pending'
  if (status === 'awaiting_processing_fee') return 'Pending'
  return 'Pending'
}

function sumRefundAdjustments(financials: OrderFinancial[]): number {
  return financials
    .filter(f => REFUND_STATUSES.has(f.settlement_status))
    .reduce((s, f) => s + f.partner_share_cents, 0)
}

export async function getPartnerEarningsForStore(storeId: string): Promise<PartnerEarningsSummary> {
  const admin = getSupabaseAdminClient()
  const { data: financials, error } = await admin
    .from('order_financials')
    .select('*')
    .eq('store_id', storeId)

  if (error) throw error
  const rows = financials ?? []

  const { data: transfers } = await admin
    .from('partner_transfers')
    .select('order_financial_id, status, amount_cents')
    .eq('store_id', storeId)

  const transferByFinancial = new Map((transfers ?? []).map(t => [t.order_financial_id, t]))

  let pendingCents = 0
  let transferredCents = 0

  for (const f of rows) {
    const t = transferByFinancial.get(f.id)
    if (t?.status === 'transferred') {
      transferredCents += t.amount_cents
    } else if (!REFUND_STATUSES.has(f.settlement_status)) {
      pendingCents += f.partner_share_cents
    }
  }

  return {
    grossSalesCents: rows.reduce((s, f) => s + f.sale_subtotal_cents, 0),
    partnerEarningsCents: rows.reduce((s, f) => s + f.partner_share_cents, 0),
    pendingCents,
    transferredCents,
    refundsAdjustmentsCents: sumRefundAdjustments(rows),
    orderCount: rows.length,
  }
}

export async function getPartnerOrderFinancials(storeId: string, limit = 50): Promise<PartnerOrderFinancialRow[]> {
  const admin = getSupabaseAdminClient()
  const { data: financials, error } = await admin
    .from('order_financials')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  if (!financials?.length) return []

  const orderIds = financials.map(f => f.order_id)
  const financialIds = financials.map(f => f.id)

  const [{ data: orders }, { data: transfers }] = await Promise.all([
    admin.from('orders').select('id, product_title_snapshot, created_at').in('id', orderIds),
    admin.from('partner_transfers').select('order_financial_id, status, stripe_transfer_id').in('order_financial_id', financialIds),
  ])

  const orderMap = new Map((orders ?? []).map(o => [o.id, o]))
  const transferMap = new Map((transfers ?? []).map(t => [t.order_financial_id, t]))

  return financials.map(f => {
    const order = orderMap.get(f.order_id)
    const transfer = transferMap.get(f.id)
    const needsReview = NEEDS_REVIEW_STATUSES.has(f.settlement_status)
      || NEEDS_REVIEW_RECON.has(f.reconciliation_status)
      || transfer?.status === 'failed'
      || transfer?.status === 'reconciliation_required'

    return {
      orderId: f.order_id,
      createdAt: order?.created_at ?? f.created_at,
      productTitle: order?.product_title_snapshot ?? null,
      grossCents: f.sale_subtotal_cents,
      affiliateCents: f.affiliate_commission_cents,
      stripeFeeCents: f.stripe_fee_cents,
      netCents: f.net_distributable_cents,
      partnerShareCents: f.partner_share_cents,
      status: f.settlement_status,
      statusLabel: formatSettlementStatusLabel(f.settlement_status, transfer?.status),
      stripeTransferId: transfer?.stripe_transfer_id ?? null,
      needsReview,
    }
  })
}

export async function getPartnershipFinancialSummary(partnershipId: string): Promise<PartnershipFinancialSummary> {
  const admin = getSupabaseAdminClient()
  const { data: financials, error } = await admin
    .from('order_financials')
    .select('*')
    .eq('partnership_id', partnershipId)

  if (error) throw error
  const rows = financials ?? []

  const { data: transfers } = await admin
    .from('partner_transfers')
    .select('order_financial_id, status, amount_cents')
    .eq('partnership_id', partnershipId)

  const transferByFinancial = new Map((transfers ?? []).map(t => [t.order_financial_id, t]))

  let pendingCents = 0
  let transferredCents = 0
  let reconciliationRequiredCount = 0

  for (const f of rows) {
    const t = transferByFinancial.get(f.id)
    if (NEEDS_REVIEW_STATUSES.has(f.settlement_status) || NEEDS_REVIEW_RECON.has(f.reconciliation_status)
      || t?.status === 'failed' || t?.status === 'reconciliation_required') {
      reconciliationRequiredCount++
    }
    if (t?.status === 'transferred') transferredCents += t.amount_cents
    else if (!REFUND_STATUSES.has(f.settlement_status)) pendingCents += f.partner_share_cents
  }

  return {
    grossSalesCents: rows.reduce((s, f) => s + f.sale_subtotal_cents, 0),
    partnerEarningsCents: rows.reduce((s, f) => s + f.partner_share_cents, 0),
    pendingCents,
    transferredCents,
    refundsAdjustmentsCents: sumRefundAdjustments(rows),
    orderCount: rows.length,
    affiliateCommissionsCents: rows.reduce((s, f) => s + f.affiliate_commission_cents, 0),
    stripeFeesCents: rows.reduce((s, f) => s + (f.stripe_fee_cents ?? 0), 0),
    sellbopRevenueCents: rows.reduce((s, f) => s + f.sellbop_share_cents, 0),
    reconciliationRequiredCount,
  }
}

export async function getOrderFinancialDetail(orderId: string) {
  const admin = getSupabaseAdminClient()
  const { data: financial, error } = await admin
    .from('order_financials')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) throw error
  if (!financial) return null

  const { data: transfer } = await admin
    .from('partner_transfers')
    .select('*')
    .eq('order_financial_id', financial.id)
    .maybeSingle()

  const { data: order } = await admin
    .from('orders')
    .select('product_title_snapshot, created_at, total_cents')
    .eq('id', orderId)
    .maybeSingle()

  return { financial, transfer, order }
}

export async function getPlatformFinancialSummary(): Promise<PlatformFinancialSummary> {
  const admin = getSupabaseAdminClient()

  const { data: financials } = await admin.from('order_financials').select('*')
  const rows = financials ?? []

  const { data: transfers } = await admin.from('partner_transfers').select('status, amount_cents')
  const { data: partnerOrders } = await admin
    .from('orders')
    .select('platform_fee_cents, store_id')
    .not('platform_fee_cents', 'is', null)

  const partnerStoreIds = new Set(rows.map(r => r.store_id))
  const normalShopPlatformFeeCents = (partnerOrders ?? [])
    .filter(o => !partnerStoreIds.has(o.store_id))
    .reduce((s, o) => s + (o.platform_fee_cents ?? 0), 0)

  let pendingTransfersCents = 0
  let failedTransfersCount = 0
  for (const t of transfers ?? []) {
    if (t.status === 'transferred') continue
    if (t.status === 'failed' || t.status === 'reconciliation_required') failedTransfersCount++
    else pendingTransfersCents += t.amount_cents
  }

  const reconciliationRequiredCount = rows.filter(f =>
    NEEDS_REVIEW_STATUSES.has(f.settlement_status) || NEEDS_REVIEW_RECON.has(f.reconciliation_status),
  ).length + failedTransfersCount

  return {
    partnerShopGrossCents: rows.reduce((s, f) => s + f.sale_subtotal_cents, 0),
    partnerEarningsCents: rows.reduce((s, f) => s + f.partner_share_cents, 0),
    sellbopPartnerRevenueCents: rows.reduce((s, f) => s + f.sellbop_share_cents, 0),
    affiliateCommissionsCents: rows.reduce((s, f) => s + f.affiliate_commission_cents, 0),
    stripeFeesCents: rows.reduce((s, f) => s + (f.stripe_fee_cents ?? 0), 0),
    refundsCents: sumRefundAdjustments(rows),
    pendingTransfersCents,
    failedTransfersCount,
    reconciliationRequiredCount,
    normalShopPlatformFeeCents,
  }
}

export interface AdminFinancialRow {
  orderId: string
  storeId: string
  storeName: string
  storeSlug: string
  productTitle: string | null
  createdAt: string
  grossCents: number
  affiliateCents: number
  stripeFeeCents: number | null
  partnerCents: number
  sellbopCents: number
  transferStatus: string | null
  statusLabel: string
  needsReview: boolean
  stripeTransferId: string | null
}

export async function listAdminPartnerFinancials(filter?: string, limit = 100): Promise<AdminFinancialRow[]> {
  const admin = getSupabaseAdminClient()
  let query = admin
    .from('order_financials')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filter === 'transferred') query = query.eq('settlement_status', 'transferred')
  else if (filter === 'pending') query = query.in('settlement_status', ['pending', 'awaiting_processing_fee', 'ready', 'transfer_pending'])
  else if (filter === 'refunded') query = query.in('settlement_status', ['refunded', 'partially_refunded'])
  else if (filter === 'failed') query = query.eq('settlement_status', 'failed')
  else if (filter === 'review') query = query.or('settlement_status.eq.failed,settlement_status.eq.reconciliation_required,reconciliation_status.eq.reconciliation_required')

  const { data: financials, error } = await query
  if (error) throw error
  if (!financials?.length) return []

  const storeIds = [...new Set(financials.map(f => f.store_id))]
  const orderIds = financials.map(f => f.order_id)
  const financialIds = financials.map(f => f.id)

  const [{ data: stores }, { data: orders }, { data: transfers }] = await Promise.all([
    admin.from('stores').select('id, name, slug').in('id', storeIds),
    admin.from('orders').select('id, product_title_snapshot, created_at').in('id', orderIds),
    admin.from('partner_transfers').select('order_financial_id, status, stripe_transfer_id').in('order_financial_id', financialIds),
  ])

  const storeMap = new Map((stores ?? []).map(s => [s.id, s]))
  const orderMap = new Map((orders ?? []).map(o => [o.id, o]))
  const transferMap = new Map((transfers ?? []).map(t => [t.order_financial_id, t]))

  return financials.map(f => {
    const store = storeMap.get(f.store_id)
    const order = orderMap.get(f.order_id)
    const transfer = transferMap.get(f.id)
    const needsReview = NEEDS_REVIEW_STATUSES.has(f.settlement_status)
      || NEEDS_REVIEW_RECON.has(f.reconciliation_status)
      || transfer?.status === 'failed'
      || transfer?.status === 'reconciliation_required'

    return {
      orderId: f.order_id,
      storeId: f.store_id,
      storeName: store?.name ?? 'Shop',
      storeSlug: store?.slug ?? '',
      productTitle: order?.product_title_snapshot ?? null,
      createdAt: order?.created_at ?? f.created_at,
      grossCents: f.sale_subtotal_cents,
      affiliateCents: f.affiliate_commission_cents,
      stripeFeeCents: f.stripe_fee_cents,
      partnerCents: f.partner_share_cents,
      sellbopCents: f.sellbop_share_cents,
      transferStatus: transfer?.status ?? null,
      statusLabel: formatSettlementStatusLabel(f.settlement_status, transfer?.status),
      needsReview,
      stripeTransferId: transfer?.stripe_transfer_id ?? null,
    }
  })
}

export type { OrderFinancial, PartnerTransfer }
