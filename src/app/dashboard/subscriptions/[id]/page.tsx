'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEMO_SUBSCRIPTIONS, DEMO_ORDERS } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, CheckCircle2, Repeat2, Shield, RotateCcw } from 'lucide-react'
import type { Subscription, SubscriptionStatus, CancelMode, AccessStatus } from '@/lib/domain/entities'

// ─── Badges ───────────────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, string> = {
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    refunded: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    expired:  'bg-neutral-100 text-neutral-400 border-neutral-100',
  }
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status]}`}>{status.replace('_', ' ')}</span>
}

function AccessBadge({ status }: { status: AccessStatus }) {
  const map: Record<AccessStatus, string> = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${map[status]}`}>{status}</span>
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-400 flex-shrink-0 w-40">{label}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [subId, setSubId] = useState<string | null>(null)
  const [sub, setSub] = useState<Subscription | null>(null)

  const [status, setStatus] = useState<SubscriptionStatus>('active')
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('active')
  const [canceledAt, setCanceledAt] = useState<string | null>(null)
  const [cancelMode, setCancelMode] = useState<CancelMode>('cancel_end_of_period')
  const [internalNotes, setInternalNotes] = useState('')

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [processingCancel, setProcessingCancel] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => { params.then(({ id }) => setSubId(id)) }, [params])

  useEffect(() => {
    if (!subId) return
    const found = DEMO_SUBSCRIPTIONS.find(s => s.id === subId)
    if (found) {
      setSub(found)
      setStatus(found.status)
      setAccessStatus(found.accessStatus)
      setCanceledAt(found.canceledAt)
      setCancelMode(found.cancelMode ?? 'cancel_end_of_period')
      setInternalNotes(found.internalNotes ?? '')
    }
  }, [subId])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  function handleCancel() {
    if (!confirmCancel) { setConfirmCancel(true); return }
    setProcessingCancel(true)
    setTimeout(() => {
      const now = new Date().toISOString()
      setStatus('canceled')
      setCanceledAt(now)
      setAccessStatus(cancelMode === 'cancel_immediately' ? 'revoked' : 'active')
      setConfirmCancel(false)
      setProcessingCancel(false)
      const msg = cancelMode === 'cancel_immediately'
        ? 'Subscription canceled immediately. Access revoked.'
        : 'Subscription canceled. Access continues until end of billing period.'
      showToast(msg)
    }, 1200)
  }

  if (!sub) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isCanceled = status === 'canceled'
  const linkedOrders = DEMO_ORDERS.filter(o => o.subscriptionId === sub.id)

  return (
    <div className="max-w-2xl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={15} className="text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Subscriptions
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-neutral-400 font-mono mb-1">{sub.id}</p>
          <h1 className="text-2xl font-bold text-black">{sub.productName}</h1>
          <p className="text-sm text-neutral-500 mt-1">{sub.customerName} · {formatCurrency(sub.amount)}/mo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubStatusBadge status={status} />
          <AccessBadge status={accessStatus} />
        </div>
      </div>

      <div className="space-y-4">

        {/* Subscription Info */}
        <Section title="Subscription Details" icon={<Repeat2 size={14} />}>
          <Row label="Product"          value={sub.productName} />
          <Row label="Amount"           value={<span className="font-bold text-black">{formatCurrency(sub.amount)}/mo</span>} />
          <Row label="Status"           value={<SubStatusBadge status={status} />} />
          <Row label="Access"           value={<AccessBadge status={accessStatus} />} />
          <Row label="Latest payment"   value={<span className="capitalize">{sub.latestPaymentStatus}</span>} />
          <Row label="Period start"     value={formatDate(sub.currentPeriodStart)} />
          <Row label="Period end"       value={formatDate(sub.currentPeriodEnd)} />
          {canceledAt && (
            <Row label="Canceled at"    value={<span className="text-neutral-500">{formatDate(canceledAt)}</span>} />
          )}
          {canceledAt && cancelMode && (
            <Row label="Cancel mode"    value={<span className="capitalize text-neutral-500">{cancelMode.replace(/_/g, ' ')}</span>} />
          )}
          <Row label="Started"          value={formatDate(sub.createdAt)} />
        </Section>

        {/* Customer */}
        <Section title="Customer" icon={<Shield size={14} />}>
          <Row label="Name"  value={sub.customerName} />
          <Row label="Email" value={<a href={`mailto:${sub.customerEmail}`} className="underline underline-offset-2 hover:text-black">{sub.customerEmail}</a>} />
        </Section>

        {/* Cancel */}
        <Section title="Cancel Subscription" icon={<RotateCcw size={14} />}>
          <div className="py-3 space-y-4">
            {isCanceled ? (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-4 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-700 mb-1">Subscription canceled</p>
                <p className="text-xs text-neutral-400">Canceled on {canceledAt ? formatDate(canceledAt) : '—'} · Mode: {cancelMode?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-neutral-400 mt-1">Access: <span className="font-medium">{accessStatus}</span></p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-neutral-600 mb-2">Cancellation timing</p>
                  <div className="flex gap-2">
                    {(['cancel_end_of_period', 'cancel_immediately'] as CancelMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setCancelMode(mode)}
                        className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-colors ${cancelMode === mode ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                      >
                        {mode === 'cancel_end_of_period' ? 'End of Period' : 'Immediately'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {cancelMode === 'cancel_end_of_period'
                      ? `Access continues until ${formatDate(sub.currentPeriodEnd)}, then access is revoked.`
                      : 'Access is revoked immediately upon cancellation.'}
                  </p>
                </div>

                {confirmCancel && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold mb-1">Confirm cancellation?</p>
                      <p className="text-xs">
                        {cancelMode === 'cancel_immediately'
                          ? 'Access will be revoked immediately. No prorated refund in demo mode.'
                          : `Subscription will end on ${formatDate(sub.currentPeriodEnd)}. No refund issued.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={processingCancel}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${confirmCancel ? 'bg-black text-white border-black hover:bg-neutral-800' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}
                  >
                    {processingCancel ? 'Canceling…' : confirmCancel ? 'Confirm Cancel' : 'Cancel Subscription'}
                  </button>
                  {confirmCancel && (
                    <button onClick={() => setConfirmCancel(false)} className="px-4 py-2.5 text-sm text-neutral-400 hover:text-black border border-neutral-200 rounded-xl transition-colors">
                      Back
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Refund latest payment placeholder */}
            <div className="border border-neutral-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-700">Refund latest payment</p>
                <p className="text-xs text-neutral-400 mt-0.5">Refund {formatCurrency(sub.amount)} to {sub.customerEmail}</p>
              </div>
              <button
                onClick={() => showToast('Demo: Refund would be issued via Stripe. Connect Stripe to enable.')}
                className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
              >
                Refund
              </button>
            </div>
          </div>
        </Section>

        {/* Linked Orders */}
        {linkedOrders.length > 0 && (
          <Section title="Linked Orders" icon={<Shield size={14} />}>
            {linkedOrders.map(o => (
              <div key={o.id} className="py-3 flex items-center justify-between border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-black">{o.productName}</p>
                  <p className="text-xs text-neutral-400">{formatDate(o.createdAt)} · {formatCurrency(o.amount)}</p>
                </div>
                <Link href={`/dashboard/orders/${o.id}`} className="text-xs text-neutral-400 hover:text-black font-medium underline underline-offset-2 transition-colors">
                  View →
                </Link>
              </div>
            ))}
          </Section>
        )}

        {/* Internal Notes */}
        <Section title="Internal Notes" icon={<Shield size={14} />}>
          <div className="py-3">
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Add internal notes…"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
            />
            <button
              onClick={() => showToast('Notes saved.')}
              className="mt-2 text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors"
            >
              Save Notes
            </button>
          </div>
        </Section>

      </div>
    </div>
  )
}
