'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEMO_ORDERS, DEMO_PRODUCTS, DEMO_SUBSCRIPTIONS } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, XCircle, Repeat2, Shield } from 'lucide-react'
import type { Order, RefundStatus, AccessStatus } from '@/lib/domain/entities'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded:  'bg-neutral-100 text-neutral-600 border-neutral-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    failed:    'bg-rose-50 text-rose-700 border-rose-200',
    paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{status}</span>
}

function RefundBadge({ status }: { status: RefundStatus }) {
  const map: Record<RefundStatus, { cls: string; label: string }> = {
    paid:           { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
    refunded:       { cls: 'bg-neutral-100 text-neutral-600 border-neutral-200', label: 'Refunded' },
    refund_pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200',        label: 'Refund Pending' },
    refund_failed:  { cls: 'bg-rose-50 text-rose-700 border-rose-200',           label: 'Refund Failed' },
  }
  const { cls, label } = map[status]
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cls}`}>{label}</span>
}

function AccessBadge({ status }: { status: AccessStatus }) {
  const map: Record<AccessStatus, string> = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status]}`}>{status}</span>
}

function RefundIcon({ status }: { status: RefundStatus }) {
  if (status === 'paid')           return <CheckCircle2 size={16} className="text-emerald-500" />
  if (status === 'refunded')       return <CheckCircle2 size={16} className="text-neutral-400" />
  if (status === 'refund_pending') return <Clock size={16} className="text-amber-500" />
  return <XCircle size={16} className="text-rose-500" />
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-400 flex-shrink-0 w-36">{label}</span>
      <span className="text-sm text-neutral-800 font-medium text-right">{value}</span>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        {icon && <span className="text-neutral-400">{icon}</span>}
        <p className="text-sm font-bold text-black">{title}</p>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [refundStatus, setRefundStatus] = useState<RefundStatus>('paid')
  const [refundedAt, setRefundedAt] = useState<string | null>(null)
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('active')
  const [refundReason, setRefundReason] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { params.then(({ id }) => setOrderId(id)) }, [params])

  useEffect(() => {
    if (!orderId) return
    const found = DEMO_ORDERS.find(o => o.id === orderId)
    if (found) {
      setOrder(found)
      setRefundStatus(found.refundStatus)
      setRefundedAt(found.refundedAt)
      setAccessStatus(found.accessStatus)
      setRefundReason(found.refundReason ?? '')
      setInternalNotes(found.internalNotes ?? '')
    }
  }, [orderId])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function handleRefund() {
    if (!confirmRefund) { setConfirmRefund(true); return }
    setProcessing(true)
    setTimeout(() => {
      setRefundStatus('refunded')
      setRefundedAt(new Date().toISOString())
      setAccessStatus('revoked')
      setConfirmRefund(false)
      setProcessing(false)
      showToast('Refund applied. Access revoked.')
    }, 1400)
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isRefunded = refundStatus === 'refunded'
  const product = DEMO_PRODUCTS.find(p => p.id === order.productId)
  const subscription = order.subscriptionId ? DEMO_SUBSCRIPTIONS.find(s => s.id === order.subscriptionId) : null

  return (
    <div className="max-w-2xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400" />{toast}
        </div>
      )}

      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Orders
      </button>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-0.5">Admin · Order Detail</p>
          <p className="text-xs text-neutral-400 font-mono mb-1">{order.id}</p>
          <h1 className="text-2xl font-bold text-black">{order.productName}</h1>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(order.createdAt, 'long')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <RefundBadge status={refundStatus} />
        </div>
      </div>

      <div className="space-y-4">

        <Section title="Order Details">
          <Row label="Product"      value={product ? <Link href={`/p/${product.slug}`} className="underline underline-offset-2 hover:text-black" target="_blank">{order.productName}</Link> : order.productName} />
          <Row label="Product type" value={<span className="capitalize">{order.productType.replace(/_/g, ' ')}</span>} />
          <Row label="Amount"       value={<span className="font-bold text-black">{formatCurrency(order.amount, order.currency)}</span>} />
          {order.discountAmount > 0 && <Row label="Discount" value={`${formatCurrency(order.discountAmount)} (${order.couponCode})`} />}
          <Row label="Payment"      value={<StatusBadge status={order.paymentStatus} />} />
          <Row label="Order status" value={<StatusBadge status={order.status} />} />
          <Row label="Access"       value={<AccessBadge status={accessStatus} />} />
          <Row label="Date"         value={formatDate(order.createdAt, 'long')} />
          <Row label="Receipt sent" value={order.receiptSent ? 'Yes' : 'No'} />
        </Section>

        <Section title="Customer">
          <Row label="Name"   value={order.customerName} />
          <Row label="Email"  value={<a href={`mailto:${order.customerEmail}`} className="underline underline-offset-2 hover:text-black">{order.customerEmail}</a>} />
          <Row label="Seller" value="Alex Johnson (seller-1)" />
          {subscription && (
            <Row label="Subscription" value={
              <Link href={`/internal/admin/subscriptions/${subscription.id}`} className="underline underline-offset-2 hover:text-black">
                {subscription.id}
              </Link>
            } />
          )}
        </Section>

        {/* Refund Management */}
        <Section title="Refund Management" icon={<Shield size={14} />}>
          <div className="py-3 space-y-4">
            <div className="flex items-center gap-3">
              <RefundIcon status={refundStatus} />
              <div>
                <p className="text-sm font-semibold text-black">Refund status</p>
                <div className="mt-1"><RefundBadge status={refundStatus} /></div>
              </div>
            </div>

            {refundedAt && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-600">
                Refunded on {new Date(refundedAt).toLocaleString()}
                {refundReason && <p className="text-xs text-neutral-400 mt-1">{refundReason}</p>}
                <p className="text-xs text-neutral-400 mt-1">Download access revoked</p>
              </div>
            )}

            {!isRefunded && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Refund reason</label>
                  <textarea
                    rows={2}
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    placeholder="Reason for refund…"
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                  />
                </div>

                {confirmRefund && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold mb-1">Confirm full refund?</p>
                      <p className="text-xs">This will mark the order as refunded and revoke download access.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleRefund}
                    disabled={processing}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${confirmRefund ? 'bg-black text-white border-black hover:bg-neutral-800' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}
                  >
                    {processing ? 'Processing…' : confirmRefund ? 'Confirm Full Refund' : 'Issue Full Refund'}
                  </button>
                  {confirmRefund && (
                    <button onClick={() => setConfirmRefund(false)} className="px-4 py-2.5 text-sm text-neutral-400 hover:text-black border border-neutral-200 rounded-xl transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </Section>

        {subscription && (
          <Section title="Linked Subscription" icon={<Repeat2 size={14} />}>
            <Row label="Subscription ID" value={<span className="font-mono text-xs">{subscription.id}</span>} />
            <Row label="Status"          value={subscription.status} />
            <Row label="Customer"        value={subscription.customerName} />
            <Row label="Next billing"    value={formatDate(subscription.currentPeriodEnd)} />
            <div className="pb-3 pt-1">
              <Link href={`/internal/admin/subscriptions/${subscription.id}`} className="text-xs font-medium text-neutral-500 hover:text-black underline underline-offset-2 transition-colors">
                Manage Subscription →
              </Link>
            </div>
          </Section>
        )}

        <Section title="Internal Notes" icon={<Shield size={14} />}>
          <div className="py-3">
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Add internal notes…"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
            />
            <button onClick={() => showToast('Notes saved.')} className="mt-2 text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors">
              Save Notes
            </button>
          </div>
        </Section>

        <div className="flex gap-2">
          <button onClick={() => showToast('Demo: Receipt re-sent to ' + order.customerEmail)} className="text-sm font-medium px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 hover:border-black hover:text-black transition-colors">
            Resend Receipt
          </button>
        </div>

      </div>
    </div>
  )
}
