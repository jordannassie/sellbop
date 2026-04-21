'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, AlertTriangle, CheckCircle2, Clock, XCircle, MinusCircle, ExternalLink } from 'lucide-react'
import { DEMO_SUBSCRIPTIONS, DEMO_CUSTOMERS, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import type { Subscription } from '@/lib/domain/entities'

type SubStatus = 'active' | 'canceled' | 'past_due' | 'refunded' | 'expired'

interface SubState {
  status: SubStatus
  canceledAt: string | null
  refundedLatest: boolean
  accessStatus: 'active' | 'revoked'
}

function SubStatusBadge({ status }: { status: SubStatus }) {
  const cfg: Record<SubStatus, { label: string; cls: string }> = {
    active:   { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    canceled: { label: 'Canceled',  cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    past_due: { label: 'Past Due',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    refunded: { label: 'Refunded',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    expired:  { label: 'Expired',   cls: 'bg-neutral-100 text-neutral-400 border-neutral-200' },
  }
  const { label, cls } = cfg[status]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>
  )
}

function SubStatusIcon({ status }: { status: SubStatus }) {
  if (status === 'active')   return <CheckCircle2 size={14} className="text-emerald-500" />
  if (status === 'canceled') return <MinusCircle size={14} className="text-neutral-400" />
  if (status === 'past_due') return <Clock size={14} className="text-amber-500" />
  if (status === 'refunded') return <CheckCircle2 size={14} className="text-blue-400" />
  return <XCircle size={14} className="text-neutral-400" />
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-xs text-neutral-800 text-right">{value}</span>
    </div>
  )
}

// ─── Subscription Detail Drawer ───────────────────────────────────────────────

function SubDetail({
  sub,
  state,
  onUpdate,
  onClose,
}: {
  sub: Subscription
  state: SubState
  onUpdate: (patch: Partial<SubState>) => void
  onClose: () => void
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [processing, setProcessing] = useState(false)

  const customer = DEMO_CUSTOMERS.find(c => c.id === sub.customerId)
  const product  = DEMO_PRODUCTS.find(p => p.id === sub.productId)

  function handleCancel() {
    if (!confirmCancel) { setConfirmCancel(true); return }
    setProcessing(true)
    setTimeout(() => {
      onUpdate({ status: 'canceled', canceledAt: new Date().toISOString(), accessStatus: 'revoked' })
      setProcessing(false)
      setConfirmCancel(false)
    }, 1000)
  }

  function handleRefundLatest() {
    setProcessing(true)
    setTimeout(() => {
      onUpdate({ refundedLatest: true, status: 'refunded' })
      setProcessing(false)
    }, 1000)
  }

  const isActive = state.status === 'active'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white border-l border-neutral-200 h-full overflow-y-auto shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Subscription Detail</p>
            <p className="text-sm font-bold text-black">{sub.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X size={15} className="text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Info */}
          <div className="space-y-3">
            <Row label="Product"      value={product?.name ?? sub.productId} />
            <Row label="Customer"     value={customer?.name ?? 'Unknown'} />
            <Row label="Email"        value={sub.customerEmail} />
            <Row label="Amount"       value={<span className="font-semibold">{formatCurrency(sub.amount)} / mo</span>} />
            <Row label="Started"      value={new Date(sub.createdAt).toLocaleDateString()} />
            <Row label="Next billing" value={new Date(sub.currentPeriodEnd).toLocaleDateString()} />
            <Row label="Status" value={
              <div className="flex items-center gap-1.5">
                <SubStatusIcon status={state.status} />
                <SubStatusBadge status={state.status} />
              </div>
            } />
            {state.canceledAt && (
              <Row label="Canceled at" value={new Date(state.canceledAt).toLocaleString()} />
            )}
          </div>

          {/* Access status */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <p className="text-xs font-bold text-black">Access Status</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                {state.accessStatus === 'active'
                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                  : <XCircle size={14} className="text-neutral-400" />
                }
                <span className={`text-sm font-semibold ${state.accessStatus === 'active' ? 'text-emerald-700' : 'text-neutral-500'}`}>
                  {state.accessStatus === 'active' ? 'Access granted' : 'Access revoked'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {state.accessStatus === 'active'
                  ? 'Subscriber can access all gated content.'
                  : 'Content access has been removed for this subscriber.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <p className="text-xs font-bold text-black">Admin Actions</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Cancel */}
              {isActive && (
                <div className="space-y-2">
                  {confirmCancel && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">Canceling will end the subscription and revoke access immediately. Cannot be undone in demo mode.</p>
                    </div>
                  )}
                  <button
                    onClick={handleCancel}
                    disabled={processing}
                    className={[
                      'w-full py-2.5 text-sm font-semibold rounded-xl transition-colors',
                      confirmCancel
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'border border-neutral-300 text-neutral-700 hover:border-neutral-500',
                    ].join(' ')}
                  >
                    {processing ? 'Processing…' : confirmCancel ? 'Confirm Cancellation' : 'Cancel Subscription'}
                  </button>
                  {confirmCancel && (
                    <button onClick={() => setConfirmCancel(false)} className="w-full text-xs text-neutral-400 hover:text-black underline underline-offset-2">
                      Never mind
                    </button>
                  )}
                </div>
              )}

              {/* Refund latest */}
              {!state.refundedLatest ? (
                <button
                  onClick={handleRefundLatest}
                  disabled={processing}
                  className="w-full py-2.5 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-xl hover:border-neutral-500 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing…' : 'Refund Latest Payment'}
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                  ✓ Latest payment refunded
                </div>
              )}

              {!isActive && !state.refundedLatest && (
                <p className="text-xs text-neutral-400 text-center">Subscription is already {state.status}.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-cyan-100 text-cyan-700']
function Avatar({ name }: { name: string }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>{initials}</div>
}

const isDemo = (email: string) => email.endsWith('.demo') || email.includes('@sellbop.demo')

// ─── Subscriptions Table ──────────────────────────────────────────────────────

export function SubscriptionsSection() {
  const subs = DEMO_SUBSCRIPTIONS
  const [selected, setSelected] = useState<Subscription | null>(null)
  const [subStates, setSubStates] = useState<Record<string, SubState>>(() =>
    Object.fromEntries(
      DEMO_SUBSCRIPTIONS.map(s => [
        s.id,
        {
          status: s.status as SubStatus,
          canceledAt: s.cancelAtPeriodEnd ? s.currentPeriodEnd : null,
          refundedLatest: false,
          accessStatus: s.status === 'active' ? 'active' : 'revoked',
        } as SubState,
      ])
    )
  )

  function updateSubState(subId: string, patch: Partial<SubState>) {
    setSubStates(prev => ({ ...prev, [subId]: { ...prev[subId], ...patch } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Subscriptions</h1>
        <span className="text-sm text-neutral-400">{subs.length} total</span>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Customer', 'Product', 'Amount', 'Status', 'Next Billing', 'Access', ''].map(c => (
                  <th key={c} className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-3 px-4 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {subs.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-neutral-400">No real subscriptions yet — connect Supabase to see live data.</td></tr>
              )}
              {subs.map(s => {
                const state    = subStates[s.id]
                const customer = DEMO_CUSTOMERS.find(c => c.id === s.customerId)
                const product  = DEMO_PRODUCTS.find(p => p.id === s.productId)
                const name     = customer?.name ?? s.customerEmail
                return (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={name} />
                        <div>
                          <p className="text-sm font-medium text-black whitespace-nowrap">{name}</p>
                          <p className="text-[11px] text-neutral-400 whitespace-nowrap">{s.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600 whitespace-nowrap">{product?.name ?? s.productId}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-black whitespace-nowrap">{formatCurrency(s.amount)}/mo</td>
                    <td className="py-3 px-4 whitespace-nowrap">{state && <SubStatusBadge status={state.status} />}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400 whitespace-nowrap">{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {state && <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        state.accessStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}>{state.accessStatus}</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => setSelected(s)} className="text-xs text-neutral-400 hover:text-black font-medium whitespace-nowrap">
                          Quick View
                        </button>
                        <Link href={`/internal/admin/subscriptions/${s.id}`} className="text-xs text-neutral-400 hover:text-black font-medium whitespace-nowrap flex items-center gap-1">
                          Detail <ExternalLink size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <SubDetail
          sub={selected}
          state={subStates[selected.id]}
          onUpdate={patch => updateSubState(selected.id, patch)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
