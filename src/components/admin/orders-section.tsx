'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X, AlertTriangle, CheckCircle2, Clock, XCircle,
  Copy, Check, Mail, Store, ExternalLink, Shield,
  Repeat2, Package, Send,
} from 'lucide-react'
import { DEMO_ORDERS, DEMO_PRODUCTS, DEMO_SUBSCRIPTIONS, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import type { Order, RefundStatus, AccessStatus } from '@/lib/domain/entities'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderState {
  refundStatus: RefundStatus
  refundedAt: string | null
  refundNote: string
  accessStatus: AccessStatus
  internalNotes: string
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded:  'bg-neutral-100 text-neutral-600 border-neutral-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    failed:    'bg-red-50 text-red-700 border-red-200',
    paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return <Badge label={status} cls={map[status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'} />
}

function RefundBadge({ status }: { status: RefundStatus }) {
  const map: Record<RefundStatus, { cls: string; label: string }> = {
    paid:           { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
    refunded:       { cls: 'bg-neutral-100 text-neutral-600 border-neutral-200', label: 'Refunded' },
    refund_pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200',        label: 'Refund Pending' },
    refund_failed:  { cls: 'bg-red-50 text-red-700 border-red-200',              label: 'Refund Failed' },
  }
  const { cls, label } = map[status]
  return <Badge label={label} cls={cls} />
}

function AccessBadge({ status }: { status: AccessStatus }) {
  const map: Record<AccessStatus, string> = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return <Badge label={status} cls={map[status]} />
}

function RefundIcon({ status }: { status: RefundStatus }) {
  if (status === 'paid')           return <CheckCircle2 size={13} className="text-emerald-500" />
  if (status === 'refunded')       return <CheckCircle2 size={13} className="text-neutral-400" />
  if (status === 'refund_pending') return <Clock size={13} className="text-amber-500" />
  return <XCircle size={13} className="text-red-500" />
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-neutral-50 last:border-0">
      <span className="text-[11px] text-neutral-400 flex-shrink-0 w-28">{label}</span>
      <span className="text-[11px] text-neutral-800 font-medium text-right flex-1">{value}</span>
    </div>
  )
}

function SectionBlock({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon && <span className="text-neutral-400">{icon}</span>}
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{title}</p>
      </div>
      <div className="bg-neutral-50/60 border border-neutral-100 rounded-xl px-4 py-1">
        {children}
      </div>
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-400 hover:text-black transition-colors"
      title={`Copy ${label ?? text}`}
    >
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]
function Avatar({ name }: { name: string }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

// ─── Quick View Drawer ────────────────────────────────────────────────────────

function OrderQuickView({
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
  const [processing, setProcessing]   = useState(false)
  const [confirmRefund, setConfirm]   = useState(false)
  const [notesSaved, setNotesSaved]   = useState(false)
  const [receiptSent, setReceiptSent] = useState(false)
  const [visible, setVisible]         = useState(false)

  // Slide-in animation
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  function handleRefund() {
    if (!confirmRefund) { setConfirm(true); return }
    setProcessing(true)
    setTimeout(() => {
      onUpdate({
        refundStatus: 'refunded',
        refundedAt: new Date().toISOString(),
        accessStatus: 'revoked',
        refundNote: state.refundNote || 'Full refund processed via admin panel.',
      })
      setProcessing(false)
      setConfirm(false)
    }, 1200)
  }

  function saveNotes() {
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  function resendReceipt() {
    setReceiptSent(true)
    setTimeout(() => setReceiptSent(false), 2500)
  }

  const isRefunded = state.refundStatus === 'refunded'
  const product     = DEMO_PRODUCTS.find(p => p.id === order.productId)
  const subscription = order.subscriptionId
    ? DEMO_SUBSCRIPTIONS.find(s => s.id === order.subscriptionId)
    : null
  const isPrintify  = !!order.fulfillmentProvider

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-white border-l border-neutral-200 shadow-2xl flex flex-col transition-transform duration-200 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drawer header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Order</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] font-mono text-neutral-500">{order.id}</p>
              <CopyButton text={order.id} label="ID" />
            </div>
            <h2 className="text-base font-bold text-black mt-1 leading-snug">{order.productName}</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col gap-1 items-end">
              <StatusBadge status={order.status} />
              <RefundBadge status={state.refundStatus} />
            </div>
            <button
              onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors ml-1"
            >
              <X size={15} className="text-neutral-500" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* A. Order Summary */}
          <SectionBlock title="Order Summary">
            <Row label="Product" value={
              product
                ? <Link href={`/p/${product.slug}`} target="_blank" className="underline underline-offset-2 hover:text-black flex items-center gap-1 justify-end">
                    {order.productName} <ExternalLink size={9} />
                  </Link>
                : order.productName
            } />
            <Row label="Type"    value={<span className="capitalize">{order.productType.replace(/_/g, ' ')}</span>} />
            <Row label="Amount"  value={<span className="font-bold text-black">{formatCurrency(order.amount, order.currency)}</span>} />
            {order.discountAmount > 0 && (
              <Row label="Discount" value={
                <span className="text-emerald-700">
                  -{formatCurrency(order.discountAmount)}
                  {order.couponCode && <code className="ml-1 bg-neutral-100 px-1 rounded text-neutral-500">{order.couponCode}</code>}
                </span>
              } />
            )}
            <Row label="Payment"  value={<StatusBadge status={order.paymentStatus} />} />
            <Row label="Access"   value={<AccessBadge status={state.accessStatus} />} />
            <Row label="Receipt"  value={order.receiptSent ? 'Sent' : 'Not sent'} />
          </SectionBlock>

          {/* B. Customer */}
          <SectionBlock title="Customer">
            <Row label="Name" value={
              <div className="flex items-center gap-2 justify-end">
                <Avatar name={order.customerName} />
                <span>{order.customerName}</span>
              </div>
            } />
            <Row label="Email" value={
              <div className="flex items-center gap-2 justify-end">
                <a href={`mailto:${order.customerEmail}`} className="underline underline-offset-2 hover:text-black">
                  {order.customerEmail}
                </a>
                <CopyButton text={order.customerEmail} label="Email" />
              </div>
            } />
            {subscription && (
              <Row label="Subscription" value={
                <Link href={`/internal/admin/subscriptions/${subscription.id}`} className="underline underline-offset-2 hover:text-black text-[11px]">
                  {subscription.id}
                </Link>
              } />
            )}
          </SectionBlock>

          {/* C. Seller */}
          <SectionBlock title="Seller" icon={<Store size={12} />}>
            <Row label="Name" value={DEMO_SELLER_PROFILE.displayName} />
            <Row label="Store" value={
              <Link
                href={`/store/${DEMO_SELLER_PROFILE.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                <ExternalLink size={9} /> View Store
              </Link>
            } />
          </SectionBlock>

          {/* D. Fulfillment / Access */}
          {isPrintify && (
            <SectionBlock title="Fulfillment" icon={<Package size={12} />}>
              <Row label="Provider"  value={<span className="capitalize">{order.fulfillmentProvider}</span>} />
              <Row label="Status"    value={<span className="capitalize">{order.fulfillmentStatus ?? 'pending'}</span>} />
              {order.printifyOrderId && (
                <Row label="Printify ID" value={
                  <div className="flex items-center gap-2 justify-end">
                    <code className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{order.printifyOrderId}</code>
                    <CopyButton text={order.printifyOrderId} label="ID" />
                  </div>
                } />
              )}
              {order.shippingAddress && (
                <Row label="Ships to" value={
                  <span>
                    {[order.shippingAddress.address1, order.shippingAddress.city, order.shippingAddress.country]
                      .filter(Boolean).join(', ')}
                  </span>
                } />
              )}
            </SectionBlock>
          )}

          {/* Linked Subscription */}
          {subscription && (
            <SectionBlock title="Linked Subscription" icon={<Repeat2 size={12} />}>
              <Row label="ID"           value={<span className="font-mono text-[10px]">{subscription.id}</span>} />
              <Row label="Status"       value={subscription.status} />
              <Row label="Next billing" value={new Date(subscription.currentPeriodEnd).toLocaleDateString()} />
              <div className="py-2">
                <Link href={`/internal/admin/subscriptions/${subscription.id}`} className="text-[11px] font-medium text-neutral-500 hover:text-black underline underline-offset-2 transition-colors">
                  Manage Subscription →
                </Link>
              </div>
            </SectionBlock>
          )}

          {/* E. Refund Management */}
          <SectionBlock title="Refund" icon={<Shield size={12} />}>
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-2">
                <RefundIcon status={state.refundStatus} />
                <RefundBadge status={state.refundStatus} />
                {state.refundedAt && (
                  <span className="text-[10px] text-neutral-400 ml-1">
                    · {new Date(state.refundedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {isRefunded && (
                <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2.5 text-[11px] text-neutral-500">
                  ✓ Refunded · Download access revoked
                  {state.refundNote && <p className="text-neutral-400 mt-0.5">{state.refundNote}</p>}
                </div>
              )}

              {!isRefunded && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-500 mb-1.5">Internal note</label>
                    <textarea
                      rows={2}
                      value={state.refundNote}
                      onChange={e => onUpdate({ refundNote: e.target.value })}
                      placeholder="Reason for refund…"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[11px] text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                    />
                  </div>

                  {confirmRefund && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertTriangle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-700">This will mark the order as refunded and revoke access. Cannot be undone in demo mode.</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleRefund}
                      disabled={processing}
                      className={[
                        'flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors',
                        confirmRefund
                          ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                          : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
                      ].join(' ')}
                    >
                      {processing ? 'Processing…' : confirmRefund ? 'Confirm Refund' : 'Issue Refund'}
                    </button>
                    {confirmRefund && (
                      <button
                        onClick={() => setConfirm(false)}
                        className="px-3 py-2 text-xs text-neutral-400 hover:text-black border border-neutral-200 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionBlock>

          {/* F. Internal Notes */}
          <SectionBlock title="Internal Notes">
            <div className="py-2 space-y-2">
              <textarea
                rows={2}
                value={state.internalNotes}
                onChange={e => onUpdate({ internalNotes: e.target.value })}
                placeholder="Add internal notes visible only to admins…"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[11px] text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
              />
              <button
                onClick={saveNotes}
                className="text-[10px] font-semibold px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors flex items-center gap-1"
              >
                {notesSaved ? <><Check size={9} className="text-emerald-500" /> Saved</> : 'Save Notes'}
              </button>
            </div>
          </SectionBlock>

        </div>

        {/* ── Footer actions ── */}
        <div className="border-t border-neutral-100 px-6 py-4 flex-shrink-0 flex items-center gap-3 flex-wrap">
          <button
            onClick={resendReceipt}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-3.5 py-2 rounded-xl transition-colors"
          >
            {receiptSent
              ? <><Check size={12} className="text-emerald-500" /> Receipt Sent</>
              : <><Send size={12} /> Resend Receipt</>}
          </button>
          <Link
            href={`/internal/admin/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-black transition-colors"
          >
            Full detail page <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </>
  )
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

export function OrdersSection() {
  const orders = DEMO_ORDERS
  const [selected, setSelected] = useState<Order | null>(null)
  const [orderStates, setOrderStates] = useState<Record<string, OrderState>>(() =>
    Object.fromEntries(
      DEMO_ORDERS.map(o => [
        o.id,
        {
          refundStatus:  o.refundStatus  ?? (o.paymentStatus === 'refunded' ? 'refunded' : 'paid'),
          refundedAt:    o.refundedAt    ?? null,
          refundNote:    o.refundReason  ?? '',
          accessStatus:  o.accessStatus  ?? 'active',
          internalNotes: o.internalNotes ?? '',
        } satisfies OrderState,
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

      <p className="text-xs text-neutral-400">Click any row to open the order quick view.</p>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Customer', 'Product', 'Amount', 'Status', 'Refund', 'Date'].map(c => (
                  <th key={c} className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-3 px-4 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                    No real orders yet — connect Supabase to see live data.
                  </td>
                </tr>
              )}
              {orders.map(o => {
                const oState = orderStates[o.id]
                const isActive = selected?.id === o.id
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(isActive ? null : o)}
                    className={[
                      'cursor-pointer transition-colors',
                      isActive
                        ? 'bg-neutral-50 border-l-2 border-l-black'
                        : 'hover:bg-neutral-50 border-l-2 border-l-transparent',
                    ].join(' ')}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={o.customerName} />
                        <div>
                          <p className="text-sm font-medium text-black whitespace-nowrap">{o.customerName}</p>
                          <p className="text-[11px] text-neutral-400">{o.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-neutral-700 max-w-[180px] truncate">{o.productName}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{o.productType.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-black text-sm whitespace-nowrap">
                      {formatCurrency(o.amount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RefundBadge status={oState.refundStatus} />
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderQuickView
          order={selected}
          state={orderStates[selected.id]}
          onUpdate={patch => updateOrderState(selected.id, patch)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
