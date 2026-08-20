'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, timeAgo } from '@/lib/utils'

type Filter = 'all' | 'pending' | 'transferred' | 'refunded' | 'failed' | 'review'

interface PlatformSummary {
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

interface FinancialRow {
  orderId: string
  storeName: string
  storeSlug: string
  productTitle: string | null
  createdAt: string
  grossCents: number
  affiliateCents: number
  stripeFeeCents: number | null
  partnerCents: number
  sellbopCents: number
  statusLabel: string
  needsReview: boolean
  stripeTransferId: string | null
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'transferred', label: 'Transferred' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'failed', label: 'Failed' },
  { id: 'review', label: 'Needs Review' },
]

export function AdminFinancialsClient() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null)
  const [rows, setRows] = useState<FinancialRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load(activeFilter: Filter) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/financials?filter=${activeFilter}`, { cache: 'no-store' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to load financials.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setSummary(data.summary)
    setRows(data.rows ?? [])
    setLoading(false)
  }

  useEffect(() => { load(filter) }, [filter])

  async function retryTransfer(orderId: string) {
    setRetrying(orderId)
    setMessage(null)
    const res = await fetch('/api/admin/financials/retry-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Transfer retry submitted.' : (data.error ?? 'Retry failed.'))
    setRetrying(null)
    if (res.ok) load(filter)
  }

  const metrics = summary ? [
    { label: 'Gross Sales (Partner)', value: summary.partnerShopGrossCents },
    { label: 'SellBop Revenue (Partner)', value: summary.sellbopPartnerRevenueCents },
    { label: 'Partner Earnings', value: summary.partnerEarningsCents },
    { label: 'Affiliate Commissions', value: summary.affiliateCommissionsCents },
    { label: 'Stripe Fees', value: summary.stripeFeesCents },
    { label: 'Refunds', value: summary.refundsCents },
    { label: 'Pending Transfers', value: summary.pendingTransfersCents },
    { label: 'Failed Transfers', value: summary.failedTransfersCount, isCount: true },
    { label: 'Needs Reconciliation', value: summary.reconciliationRequiredCount, isCount: true },
    { label: 'Normal Shop Revenue', value: summary.normalShopPlatformFeeCents, subtitle: 'Platform fees from non-Partner shops' },
  ] : []

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active="financials" />
      <main className="flex-1 overflow-y-auto">
        <AdminTopBar section="financials" />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-black">Financials</h1>
          <p className="text-sm text-neutral-500 mt-1">Partner Shop financial records and reconciliation</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {loading && !summary ? (
            <div className="mt-8 h-32 bg-neutral-100 rounded-xl animate-pulse" />
          ) : summary && (
            <>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
                {metrics.map(m => (
                  <div key={m.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="text-xs text-neutral-500">{m.label}</p>
                    <p className="text-lg font-bold text-black mt-1">
                      {m.isCount ? m.value : formatCurrency(m.value / 100)}
                    </p>
                    {'subtitle' in m && m.subtitle && (
                      <p className="text-[10px] text-neutral-400 mt-1">{m.subtitle}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === f.id ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {f.label}
                    {f.id === 'review' && summary.reconciliationRequiredCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                        {summary.reconciliationRequiredCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {message && <p className="text-sm text-neutral-600 mt-4">{message}</p>}

              <div className="mt-4 rounded-xl border border-neutral-200 bg-white overflow-hidden">
                {rows.length === 0 ? (
                  <p className="p-8 text-sm text-neutral-500 text-center">No records for this filter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Shop</th>
                          <th className="px-4 py-3 text-right">Gross</th>
                          <th className="px-4 py-3 text-right">Affiliate</th>
                          <th className="px-4 py-3 text-right">Stripe</th>
                          <th className="px-4 py-3 text-right">Partner</th>
                          <th className="px-4 py-3 text-right">SellBop</th>
                          <th className="px-4 py-3">Transfer</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {rows.map(row => (
                          <tr key={row.orderId} className="hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <Link href={`/internal/admin/orders/${row.orderId}`} className="text-xs font-mono text-neutral-600 hover:text-black">
                                {row.orderId.slice(0, 8)}…
                              </Link>
                              <p className="text-[10px] text-neutral-400">{timeAgo(row.createdAt)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{row.storeName}</p>
                              <p className="text-xs text-neutral-400 truncate max-w-[120px]">{row.productTitle ?? '—'}</p>
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.grossCents / 100)}</td>
                            <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(row.affiliateCents / 100)}</td>
                            <td className="px-4 py-3 text-right text-neutral-500">
                              {row.stripeFeeCents != null ? formatCurrency(row.stripeFeeCents / 100) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.partnerCents / 100)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.sellbopCents / 100)}</td>
                            <td className="px-4 py-3 text-xs font-mono text-neutral-500">
                              {row.stripeTransferId ? row.stripeTransferId.slice(0, 12) + '…' : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {row.needsReview ? (
                                <Badge variant="danger">Needs Review</Badge>
                              ) : (
                                <Badge variant="neutral">{row.statusLabel}</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {(row.statusLabel === 'Needs Review' || row.statusLabel === 'Pending') && (
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  disabled={retrying === row.orderId}
                                  onClick={() => retryTransfer(row.orderId)}
                                >
                                  {retrying === row.orderId ? '…' : 'Retry Transfer'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
