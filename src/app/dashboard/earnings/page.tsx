'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface EarningsSummary {
  grossSalesCents: number
  partnerEarningsCents: number
  pendingCents: number
  transferredCents: number
  refundsAdjustmentsCents: number
  orderCount: number
}

interface OrderRow {
  orderId: string
  createdAt: string
  productTitle: string | null
  grossCents: number
  affiliateCents: number
  stripeFeeCents: number | null
  netCents: number
  partnerShareCents: number
  statusLabel: string
  needsReview: boolean
}

function statusVariant(label: string) {
  if (label === 'Transferred') return 'success'
  if (label === 'Needs Review') return 'danger'
  if (label.includes('Refund')) return 'warning'
  return 'neutral'
}

export default function PartnerEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/partnerships/earnings', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error('This shop is not a Partner Shop.')
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Could not load earnings.')
        }
        return res.json()
      })
      .then((data) => {
        setSummary(data.summary)
        setOrders(data.orders ?? [])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-800">Unable to load earnings</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <Link href="/dashboard" className="inline-block mt-4">
          <Button size="sm" variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!summary) return null

  const statCards = [
    { label: 'Gross Sales', value: summary.grossSalesCents },
    { label: 'Partner Earnings', value: summary.partnerEarningsCents },
    { label: 'Pending', value: summary.pendingCents },
    { label: 'Transferred', value: summary.transferredCents },
    { label: 'Refunds / Adjustments', value: summary.refundsAdjustmentsCents },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Partner Earnings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {summary.orderCount} order{summary.orderCount === 1 ? '' : 's'} · amounts from financial snapshots
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {statCards.map(card => (
            <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-black">{formatCurrency(card.value / 100)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Order Breakdown</h2>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">No Partner orders yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-right">Gross</th>
                    <th className="px-4 py-3 font-medium text-right">Affiliate</th>
                    <th className="px-4 py-3 font-medium text-right">Stripe Fee</th>
                    <th className="px-4 py-3 font-medium text-right">Net</th>
                    <th className="px-4 py-3 font-medium text-right">Your Share</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {orders.map(row => (
                    <tr key={row.orderId} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{timeAgo(row.createdAt)}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate">{row.productTitle ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.grossCents / 100)}</td>
                      <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(row.affiliateCents / 100)}</td>
                      <td className="px-4 py-3 text-right text-neutral-500">
                        {row.stripeFeeCents != null ? formatCurrency(row.stripeFeeCents / 100) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.netCents / 100)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.partnerShareCents / 100)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.statusLabel)}>{row.statusLabel}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {orders.map(row => (
                <div key={row.orderId} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{row.productTitle ?? 'Order'}</p>
                      <p className="text-xs text-neutral-400">{timeAgo(row.createdAt)}</p>
                    </div>
                    <Badge variant={statusVariant(row.statusLabel)}>{row.statusLabel}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-neutral-500">Gross</span>
                    <span className="text-right">{formatCurrency(row.grossCents / 100)}</span>
                    <span className="text-neutral-500">Affiliate</span>
                    <span className="text-right">{formatCurrency(row.affiliateCents / 100)}</span>
                    <span className="text-neutral-500">Stripe</span>
                    <span className="text-right">
                      {row.stripeFeeCents != null ? formatCurrency(row.stripeFeeCents / 100) : '—'}
                    </span>
                    <span className="text-neutral-500">Your Share</span>
                    <span className="text-right font-semibold">{formatCurrency(row.partnerShareCents / 100)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
