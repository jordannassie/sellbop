'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EarningsSummary {
  grossSalesCents: number
  partnerEarningsCents: number
  pendingCents: number
  transferredCents: number
  refundsAdjustmentsCents: number
}

export function PartnerEarningsCard() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/partnerships/earnings', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 404) return null
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Could not load earnings.')
        }
        return res.json()
      })
      .then((data) => {
        if (!data) {
          setSummary(null)
          return
        }
        setSummary(data.summary)
      })
      .catch((err: Error) => {
        setError(err.message)
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="h-5 w-32 bg-neutral-100 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-neutral-50 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-800">Partner earnings unavailable</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    )
  }

  if (!summary) return null

  const rows = [
    { label: 'Gross Sales', value: summary.grossSalesCents },
    { label: 'Your Earnings', value: summary.partnerEarningsCents, bold: true },
    { label: 'Transferred', value: summary.transferredCents },
    { label: 'Pending', value: summary.pendingCents },
  ]

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-black">Partner Earnings</h3>
          <p className="text-xs text-neutral-500 mt-0.5">From recorded order financials</p>
        </div>
        <Link
          href="/dashboard/earnings"
          className="flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
        >
          View earnings <ArrowRight size={12} />
        </Link>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">{row.label}</span>
            <span className={row.bold ? 'font-bold text-black' : 'font-medium text-neutral-900'}>
              {formatCurrency(row.value / 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
