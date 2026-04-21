'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, AlertTriangle, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react'
import { DEMO_ORDERS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/lib/domain/entities'

type RefundStatus = 'paid' | 'refunded' | 'refund_pending' | 'refund_failed'

interface OrderState {
  refundStatus: RefundStatus
  refundedAt: string | null
  refundNote: string
}

function refundStatusBadge(status: RefundStatus) {
  const cfg: Record<RefundStatus, { label: string; cls: string }> = {
    paid:            { label: 'Paid',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    refunded:        { label: 'Refunded',       cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    refund_pending:  { label: 'Refund Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    refund_failed:   { label: 'Refund Failed',  cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const { label, cls } = cfg[status]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>
  )
}

function orderStatusBadge(status: string) {
  const cfg: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded:  'bg-neutral-100 text-neutral-600 border-neutral-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    failed:    'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg[status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{status}</span>
  )
}

function RefundStatusIcon({ status }: { status: RefundStatus }) {
  if (status === 'paid')           return <CheckCircle2 size={14} className="text-emerald-500" />
  if (status === 'refunded')       return <CheckCircle2 size={14} className="text-neutral-400" />
  if (status === 'refund_pending') return <Clock size={14} className="text-amber-500" />
  return <XCircle size={14} className="text-red-500" />
}

// ─── Order Detail Drawer ───────────────────────────────────────────────────────

function OrderDetail({
  order,
  state,
  onUpdate,
  onClose,
}: {
  order: Order
  state: OrderState
  onUpdate: (s: Partial<OrderState>) => void
  onClose: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const [confirmRefund, setConfirmRefund] = useState(false)

  function handleRefund() {
    if (!confirmRefund) { setConfirmRefund(true); return }
    setProcessing(true)
    setTimeout(() => {
      onUpdate({
        refundStatus: 'refunded',
        refundedAt: new Date().toISOString(),
        refundNote: state.refundNote || 'Full refund processed via admin panel.',
      })
      setProcessing(false)
      setConfirmRefund(false)
    }, 1200)
  }

  const isAlreadyRefunded = state.refundStatus === 'refunded'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white border-l border-neutral-200 h-full overflow-y-auto shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Order Detail</p>
            <p className="text-sm font-bold text-black">{order.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X size={15} className="text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Order info */}
          <div className="space-y-3">
            <Row label="Product"   value={order.productName} />
            <Row label="Type"      value={<span className="capitalize">{order.productType.replace('_',' ')}</span>} />
            <Row label="Customer"  value={order.customerName} />
            <Row label="Email"     value={order.customerEmail} />
            <Row label="Amount"    value={<span className="font-semibold">{formatCurrency(order.amount)}</span>} />
            <Row label="Date"      value={new Date(order.createdAt).toLocaleString()} />
            <Row label="Status"    value={orderStatusBadge(order.status)} />
            {order.couponCode && <Row label="Coupon" value={<code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{order.couponCode}</code>} />}
          </div>

          {/* Refund section */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <p className="text-xs font-bold text-black">Refund Management</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <RefundStatusIcon status={state.refundStatus} />
                <div>
                  <p className="text-xs font-semibold text-black">Current status</p>
                  <div className="mt-1">{refundStatusBadge(state.refundStatus)}</div>
                </div>
              </div>

              {state.refundedAt && (
                <Row label="Refunded at" value={new Date(state.refundedAt).toLocaleString()} />
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Internal note</label>
                <textarea
                  rows={2}
                  value={state.refundNote}
                  onChange={e => onUpdate({ refundNote: e.target.value })}
                  disabled={isAlreadyRefunded}
                  placeholder="Reason for refund..."
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none disabled:opacity-50"
                />
              </div>

              {!isAlreadyRefunded && (
                <div className="space-y-2">
                  {confirmRefund && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">This will mark the order as refunded and revoke download access. This action cannot be undone in demo mode.</p>
                    </div>
                  )}
                  <button
                    onClick={handleRefund}
                    disabled={processing}
                    className={[
                      'w-full py-2.5 text-sm font-semibold rounded-xl transition-colors',
                      confirmRefund
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'border border-neutral-300 text-neutral-700 hover:border-neutral-500',
                    ].join(' ')}
                  >
                    {processing ? 'Processing…' : confirmRefund ? 'Confirm Full Refund' : 'Full Refund'}
                  </button>
                  {confirmRefund && (
                    <button onClick={() => setConfirmRefund(false)} className="w-full text-xs text-neutral-400 hover:text-black underline underline-offset-2">
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {isAlreadyRefunded && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-xs text-neutral-500">
                  ✓ Refunded · Download access revoked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-xs text-neutral-800 text-right">{value}</span>
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

// ─── Orders Table ─────────────────────────────────────────────────────────────

export function OrdersSection() {
  const orders = DEMO_ORDERS
  const [selected, setSelected] = useState<Order | null>(null)
  const [orderStates, setOrderStates] = useState<Record<string, OrderState>>(() =>
    Object.fromEntries(
      DEMO_ORDERS.map(o => [
        o.id,
        {
          refundStatus: o.paymentStatus === 'refunded' ? 'refunded' : 'paid' as RefundStatus,
          refundedAt: o.paymentStatus === 'refunded' ? o.createdAt : null,
          refundNote: '',
        },
      ])
    )
  )

  function updateOrderState(orderId: string, patch: Partial<OrderState>) {
    setOrderStates(prev => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Orders</h1>
        <span className="text-sm text-neutral-400">{orders.length} total</span>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Refund', 'Date', ''].map(c => (
                  <th key={c} className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-3 px-4 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-neutral-400">No real orders yet — connect Supabase to see live data.</td></tr>
              )}
              {orders.map(o => {
                const oState = orderStates[o.id]
                return (
                  <tr key={o.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-[11px] text-neutral-400 font-mono whitespace-nowrap">{o.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={o.customerName} />
                        <div>
                          <p className="text-sm font-medium text-black whitespace-nowrap">{o.customerName}</p>
                          <p className="text-[11px] text-neutral-400 whitespace-nowrap">{o.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600 max-w-[160px] truncate whitespace-nowrap">{o.productName}</td>
                    <td className="py-3 px-4 font-semibold text-black text-sm whitespace-nowrap">{formatCurrency(o.amount)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{orderStatusBadge(o.status)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{refundStatusBadge(oState.refundStatus)}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => setSelected(o)} className="text-xs text-neutral-400 hover:text-black font-medium whitespace-nowrap">
                          Quick View
                        </button>
                        <Link href={`/internal/admin/orders/${o.id}`} className="text-xs text-neutral-400 hover:text-black font-medium whitespace-nowrap flex items-center gap-1">
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
        <OrderDetail
          order={selected}
          state={orderStates[selected.id]}
          onUpdate={patch => updateOrderState(selected.id, patch)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
