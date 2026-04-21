'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DEMO_ORDERS, DEMO_PRODUCTS, DEMO_SUBSCRIPTIONS } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Download, ExternalLink, ShoppingBag, LogOut, AlertTriangle, Repeat2, CheckCircle2, X } from 'lucide-react'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import type { Order, Subscription, SubscriptionStatus, CancelMode, AccessStatus } from '@/lib/domain/entities'

// ─── Subscription cancel modal ────────────────────────────────────────────────

function CancelModal({
  sub,
  onConfirm,
  onClose,
}: {
  sub: Subscription
  onConfirm: (mode: CancelMode) => void
  onClose: () => void
}) {
  const [mode] = useState<CancelMode>('cancel_end_of_period')
  const [step, setStep] = useState<'confirm' | 'done'>('confirm')
  const [processing, setProcessing] = useState(false)

  function handleConfirm() {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setStep('done')
      setTimeout(() => { onConfirm(mode); onClose() }, 1800)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {step === 'confirm' ? (
          <>
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Cancel Subscription</p>
                <p className="text-base font-bold text-black">{sub.productName}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors mt-0.5">
                <X size={15} className="text-neutral-400" />
              </button>
            </div>
            <div className="px-6 pb-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Canceling will end your access</p>
                  <p className="text-xs text-amber-700">Your subscription will remain active until <strong>{formatDate(sub.currentPeriodEnd)}</strong>, then access will be removed. No refund is issued.</p>
                </div>
              </div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium text-black mb-1">{sub.productName}</p>
                <p className="text-xs text-neutral-400">{formatCurrency(sub.amount)}/mo · Access until {formatDate(sub.currentPeriodEnd)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition-colors"
                >
                  {processing ? 'Canceling…' : 'Yes, cancel subscription'}
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors">
                  Keep subscription
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-black mb-1">Subscription canceled</p>
            <p className="text-sm text-neutral-500">Access continues until {formatDate(sub.currentPeriodEnd)}.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const [status, setStatus] = useState<SubscriptionStatus>(sub.status)
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(sub.accessStatus)
  const [showCancel, setShowCancel] = useState(false)

  function handleCanceled(mode: CancelMode) {
    setStatus('canceled')
    setAccessStatus(mode === 'cancel_immediately' ? 'revoked' : 'active')
  }

  const statusColors: Record<SubscriptionStatus, string> = {
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    refunded: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    expired:  'bg-neutral-100 text-neutral-400 border-neutral-100',
  }

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <GradientImageFallback productType="subscription" iconSize="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
              <div>
                <p className="font-semibold text-black">{sub.productName}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatCurrency(sub.amount)}/month</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[status]}`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            {status === 'active' && (
              <div className="text-xs text-neutral-500 mb-3">
                <span className="font-medium text-neutral-700">Next billing:</span>{' '}
                {formatDate(sub.currentPeriodEnd)} · Access: <span className="text-emerald-600 font-medium">Active</span>
              </div>
            )}
            {status === 'canceled' && (
              <div className="text-xs text-neutral-500 mb-3">
                {accessStatus === 'active'
                  ? `Access continues until ${formatDate(sub.currentPeriodEnd)}.`
                  : 'Access has been removed.'}
              </div>
            )}
            {status === 'past_due' && (
              <div className="text-xs text-amber-600 mb-3 font-medium">
                Payment failed. Please update your payment method.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {status === 'active' && (
                <>
                  <Button size="xs" variant="secondary" onClick={() => alert('Demo: Subscription management portal would open here.')}>
                    <Repeat2 size={12} /> Manage
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setShowCancel(true)}>
                    Cancel Subscription
                  </Button>
                </>
              )}
              {status === 'canceled' && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <CheckCircle2 size={12} className="text-neutral-400" />
                  Canceled · {accessStatus === 'active' ? `Access until ${formatDate(sub.currentPeriodEnd)}` : 'Access removed'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancel && (
        <CancelModal
          sub={sub}
          onConfirm={handleCanceled}
          onClose={() => setShowCancel(false)}
        />
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const { session, loading, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tab, setTab] = useState<'purchases' | 'subscriptions'>('purchases')

  useEffect(() => {
    if (!loading && !session) router.push('/login')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    const buyerOrders = DEMO_ORDERS.filter(o => o.customerEmail === session.email)
    const display = buyerOrders.length > 0
      ? buyerOrders
      : DEMO_ORDERS.filter(o => o.customerEmail === 'jordan@sellbop.demo').slice(0, 3)
    setOrders(display.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

    const buyerSubs = DEMO_SUBSCRIPTIONS.filter(s => s.customerEmail === session.email)
    setSubscriptions(buyerSubs)
  }, [session])

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalSpend = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.amount, 0)
  const activeSubCount = subscriptions.filter(s => s.status === 'active').length

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <SellBopLogo size="lg" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-neutral-700">{session.name}</p>
              <p className="text-xs text-neutral-400">{session.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors">
              <LogOut size={13} />Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">My Library</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {orders.length} purchase{orders.length !== 1 ? 's' : ''} · {formatCurrency(totalSpend)} total spent
            {activeSubCount > 0 && ` · ${activeSubCount} active subscription${activeSubCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Spent', value: formatCurrency(totalSpend) },
            { label: 'Purchases', value: orders.length.toString() },
            { label: 'Subscriptions', value: subscriptions.length.toString() },
          ].map(s => (
            <div key={s.label} className="bg-white border border-neutral-200 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5">
          {([['purchases', 'Purchases'], ['subscriptions', 'Subscriptions']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${tab === key ? 'bg-black text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
            >
              {label}
              {key === 'subscriptions' && subscriptions.length > 0 && (
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {subscriptions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Purchases tab */}
        {tab === 'purchases' && (
          <>
            {orders.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
                <EmptyState
                  icon={<ShoppingBag size={32} />}
                  title="No purchases yet"
                  description="Browse the store and buy something!"
                  action={<Link href="/store/alexjohnson"><Button size="sm">Browse Store →</Button></Link>}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const product = DEMO_PRODUCTS.find(p => p.id === order.productId)
                  const isDownload = order.productType === 'digital_download' || order.productType === 'bundle'
                  const isService = order.productType === 'service_offer'
                  const isRefunded = order.refundStatus === 'refunded' || order.status === 'refunded'

                  return (
                    <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <GradientImageFallback productType={order.productType} iconSize="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-semibold text-black">{order.productName}</p>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                Purchased {formatDate(order.createdAt)} · {formatCurrency(order.amount)}
                              </p>
                            </div>
                            <Badge variant={order.status === 'completed' ? 'success' : order.status === 'refunded' ? 'warning' : 'neutral'}>
                              {order.status}
                            </Badge>
                          </div>

                          {isRefunded && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2">
                              <AlertTriangle size={12} className="text-neutral-400 flex-shrink-0" />
                              <span>
                                This order was refunded
                                {order.refundedAt ? ` on ${formatDate(order.refundedAt)}` : ''}.
                                {' '}Download access has been revoked.
                              </span>
                            </div>
                          )}

                          {!isRefunded && order.status === 'completed' && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {isDownload && (
                                <Button
                                  size="xs"
                                  onClick={() => alert(`Demo: Secure download link generated.\n\nIn production, a signed URL is created from Supabase Storage tied to your purchase token.`)}
                                >
                                  <Download size={12} />Download Files
                                </Button>
                              )}
                              {isService && product?.externalUrl && (
                                <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="xs">
                                    <ExternalLink size={12} />Schedule Session
                                  </Button>
                                </a>
                              )}
                              <Link href={`/p/${product?.slug ?? ''}`}>
                                <Button size="xs" variant="ghost">View Product →</Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Subscriptions tab */}
        {tab === 'subscriptions' && (
          <>
            {subscriptions.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
                <EmptyState
                  icon={<Repeat2 size={32} />}
                  title="No active subscriptions"
                  description="Subscribe to a membership or recurring product to see it here."
                  action={<Link href="/store/alexjohnson"><Button size="sm">Browse Products →</Button></Link>}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => (
                  <SubscriptionCard key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/store/alexjohnson">
            <Button variant="secondary">Browse More Products →</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
