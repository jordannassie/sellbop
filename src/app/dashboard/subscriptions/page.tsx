'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DEMO_SUBSCRIPTIONS, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Repeat2, ChevronRight } from 'lucide-react'
import type { Subscription, SubscriptionStatus } from '@/lib/domain/entities'

function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, string> = {
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    refunded: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    expired:  'bg-neutral-100 text-neutral-400 border-neutral-100',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

const AVATAR_COLORS = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-cyan-100 text-cyan-700']
function Avatar({ name }: { name: string }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>{initials}</div>
}

const STATUS_FILTERS: Array<SubscriptionStatus | 'all'> = ['all', 'active', 'canceled', 'past_due', 'expired']

export default function SubscriptionsPage() {
  const [filter, setFilter] = useState<SubscriptionStatus | 'all'>('all')

  const subs = DEMO_SUBSCRIPTIONS.filter(s => filter === 'all' || s.status === filter)
  const totalMRR = DEMO_SUBSCRIPTIONS.filter(s => s.status === 'active').reduce((n, s) => n + s.amount, 0)
  const activeCount = DEMO_SUBSCRIPTIONS.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Subscriptions</h1>
        <p className="text-sm text-neutral-500 mt-1">{DEMO_SUBSCRIPTIONS.length} total · {formatCurrency(totalMRR)}/mo MRR</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: activeCount.toString() },
          { label: 'Monthly MRR', value: formatCurrency(totalMRR) },
          { label: 'Canceled', value: DEMO_SUBSCRIPTIONS.filter(s => s.status === 'canceled').length.toString() },
          { label: 'Past Due', value: DEMO_SUBSCRIPTIONS.filter(s => s.status === 'past_due').length.toString() },
        ].map(s => (
          <div key={s.label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${filter === f ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Customer', 'Product', 'Amount', 'Status', 'Next billing', 'Started', ''].map(c => (
                  <th key={c} className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-3 px-4 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {subs.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-neutral-400">No subscriptions matching this filter.</td></tr>
              )}
              {subs.map(sub => (
                <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={sub.customerName} />
                      <div>
                        <p className="text-sm font-medium text-black whitespace-nowrap">{sub.customerName}</p>
                        <p className="text-[11px] text-neutral-400 whitespace-nowrap">{sub.customerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 whitespace-nowrap">{sub.productName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-black whitespace-nowrap">{formatCurrency(sub.amount)}/mo</td>
                  <td className="py-3 px-4 whitespace-nowrap"><SubStatusBadge status={sub.status} /></td>
                  <td className="py-3 px-4 text-sm text-neutral-500 whitespace-nowrap">
                    {sub.status === 'canceled' ? <span className="text-neutral-400">—</span> : formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-400 whitespace-nowrap">{formatDate(sub.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/dashboard/subscriptions/${sub.id}`} className="text-xs text-neutral-400 hover:text-black font-medium flex items-center gap-1 justify-end whitespace-nowrap">
                      Manage <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {subs.length === 0 && filter === 'all' && (
        <div className="text-center py-12">
          <Repeat2 size={32} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No subscriptions yet. When buyers subscribe to your products, they&apos;ll appear here.</p>
        </div>
      )}
    </div>
  )
}
