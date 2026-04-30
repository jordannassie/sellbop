'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Repeat2,
  ShoppingBag,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LibraryOrder {
  id: string
  productName: string
  amount: number
  status: string
  paymentStatus: string
  createdAt: string
}

interface LibrarySubscription {
  id: string
  customerEmail: string
  productName: string
  productSlug: string | null
  amount: number
  currency: string
  status: string
  currentPeriodEnd: string | null
  createdAt: string
}

export function DashboardPurchasesView() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<LibraryOrder[]>([])
  const [subscriptions, setSubscriptions] = useState<LibrarySubscription[]>([])
  const [tab, setTab] = useState<'purchases' | 'subscriptions'>('purchases')
  const [libraryLoading, setLibraryLoading] = useState(true)

  useEffect(() => {
    if (!session) return

    let active = true

    async function loadLibrary() {
      setLibraryLoading(true)
      const res = await fetch('/api/library', { cache: 'no-store' })
      const data = (await res.json()) as {
        orders?: LibraryOrder[]
        subscriptions?: LibrarySubscription[]
      }

      if (!active) return

      setOrders(data.orders ?? [])
      setSubscriptions(data.subscriptions ?? [])
      setLibraryLoading(false)
    }

    void loadLibrary()

    return () => {
      active = false
    }
  }, [session])

  const totalSpend = orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.amount, 0)

  const activeSubCount = subscriptions.filter((subscription) => subscription.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Purchases</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {orders.length} purchase{orders.length !== 1 ? 's' : ''} · {formatCurrency(totalSpend)} total spent
            {activeSubCount > 0 && ` · ${activeSubCount} active subscription${activeSubCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {(orders.length > 0 || subscriptions.length > 0) && (
          <Link href="/marketplace">
            <Button size="sm">Browse Marketplace</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Spent', value: formatCurrency(totalSpend) },
          { label: 'Purchases', value: orders.length.toString() },
          { label: 'Subscriptions', value: subscriptions.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-1 text-xs text-neutral-500">{stat.label}</p>
            <p className="text-lg font-bold text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {([
          ['purchases', 'Purchases'],
          ['subscriptions', 'Subscriptions'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-black text-white'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {libraryLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      ) : tab === 'purchases' ? (
        orders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title="No purchases yet"
              description="Things you buy with this account will show up here. Customer sales you receive as a seller stay in the Orders tab."
              action={
                <Link href="/marketplace">
                  <Button size="sm">Browse Marketplace</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-black">{order.productName}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Purchased {formatDate(order.createdAt)} · {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {order.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    onClick={() => window.alert(`Protected download delivery will be served with signed Supabase URLs for order ${order.id}.`)}
                  >
                    <Download size={12} /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <EmptyState
            icon={<Repeat2 size={32} />}
            title="No subscriptions yet"
            description="Recurring purchases will appear here once you subscribe."
            action={
              <Link href="/marketplace">
                <Button size="sm">Browse Marketplace</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-black">{subscription.productName}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {formatCurrency(subscription.amount, subscription.currency)} / period
                    {subscription.currentPeriodEnd ? ` · Next billing ${formatDate(subscription.currentPeriodEnd)}` : ''}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  subscription.status === 'active'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                }`}>
                  {subscription.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {subscription.productSlug && (
                  <Link href={`/p/${subscription.productSlug}`}>
                    <Button size="xs" variant="ghost">
                      <ExternalLink size={12} /> View Product
                    </Button>
                  </Link>
                )}
                {subscription.status === 'active' && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 size={12} />
                    Access active
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
