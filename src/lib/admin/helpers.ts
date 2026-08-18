import 'server-only'

import { MARKETPLACE_FEE_PERCENT } from '@/lib/platform-config'

export function isMissingRelationError(error: { code?: string | null; message?: string } | null) {
  return error?.code === 'PGRST205' || error?.message?.includes('does not exist')
}

export function isMissingColumnError(error: { code?: string | null; message?: string } | null) {
  return error?.code === '42703' || error?.message?.includes('column')
}

export type SaleSource = 'direct' | 'marketplace' | 'free'

export function inferSaleSource(order: {
  totalCents: number
  platformFeeCents: number
}): SaleSource {
  if (order.totalCents <= 0) return 'free'
  const ratio = order.platformFeeCents / order.totalCents
  const marketplaceRatio = MARKETPLACE_FEE_PERCENT / 100
  if (Math.abs(ratio - marketplaceRatio) <= 0.02) return 'marketplace'
  return 'direct'
}

export interface AdminPaginationParams {
  page: number
  pageSize: number
  q?: string
  filter?: string
}

export function parseAdminPagination(
  params: Record<string, string | undefined>,
  defaultPageSize = 25,
): AdminPaginationParams {
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(params.pageSize ?? String(defaultPageSize), 10) || defaultPageSize))
  return {
    page,
    pageSize,
    q: params.q?.trim() || undefined,
    filter: params.filter?.trim() || undefined,
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    pageSize,
  }
}

export function sellerNetCents(order: {
  totalCents: number
  platformFeeCents: number
  affiliateCommissionCents: number
}) {
  return Math.max(0, order.totalCents - order.platformFeeCents - order.affiliateCommissionCents)
}
