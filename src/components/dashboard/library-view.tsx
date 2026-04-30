'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  HeadphonesIcon,
  Mail,
  Repeat2,
  Rss,
  Star,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LibraryOrder {
  id: string
  productName: string
  productType?: string
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

type LibraryTab = 'downloads' | 'subscriptions' | 'coaching' | 'updates' | 'support'

const TABS: { key: LibraryTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'downloads', label: 'Downloads', icon: Download },
  { key: 'subscriptions', label: 'Subscriptions', icon: Repeat2 },
  { key: 'coaching', label: 'Coaching', icon: Star },
  { key: 'updates', label: 'Updates', icon: Rss },
  { key: 'support', label: 'Support', icon: HeadphonesIcon },
]

function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const isActive = status === 'active' || status === 'completed' || status === 'paid'
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-neutral-200 bg-neutral-100 text-neutral-600'
      } ${className}`}
    >
      {status}
    </span>
  )
}

function LoadingCard() {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
    </div>
  )
}

function NoSessionPrompt() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
      <BookOpen size={32} className="mx-auto mb-3 text-neutral-300" />
      <p className="font-semibold text-black">Sign in to see your library</p>
      <p className="mt-1 text-sm text-neutral-500">
        Your purchases, subscriptions, and downloads appear here.
      </p>
      <div className="mt-4">
        <Link href="/login">
          <Button size="sm">Sign in</Button>
        </Link>
      </div>
    </div>
  )
}

export function BuyerLibraryView() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<LibraryOrder[]>([])
  const [subscriptions, setSubscriptions] = useState<LibrarySubscription[]>([])
  const [tab, setTab] = useState<LibraryTab>('downloads')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return

    let active = true

    async function loadLibrary() {
      setLoading(true)
      try {
        const res = await fetch('/api/library', { cache: 'no-store' })
        const data = (await res.json()) as {
          orders?: LibraryOrder[]
          subscriptions?: LibrarySubscription[]
        }
        if (!active) return
        setOrders(data.orders ?? [])
        setSubscriptions(data.subscriptions ?? [])
      } catch {
        // silently fail — user sees empty states
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadLibrary()
    return () => { active = false }
  }, [session])

  const totalSpend = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.amount, 0)

  const activeSubCount = subscriptions.filter((s) => s.status === 'active').length

  const coachingOrders = orders.filter(
    (o) => o.productType === 'service_offer' || o.productType === 'coaching',
  )
  const downloadOrders = orders.filter(
    (o) => !o.productType || o.productType === 'digital_download' || o.productType === 'bundle',
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Library</h1>
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

      {/* Stats */}
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

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-black text-white'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!session ? (
        <NoSessionPrompt />
      ) : loading ? (
        <LoadingCard />
      ) : tab === 'downloads' ? (
        <DownloadsTab orders={downloadOrders} />
      ) : tab === 'subscriptions' ? (
        <SubscriptionsTab subscriptions={subscriptions} />
      ) : tab === 'coaching' ? (
        <CoachingTab orders={coachingOrders} />
      ) : tab === 'updates' ? (
        <UpdatesTab />
      ) : (
        <SupportTab />
      )}
    </div>
  )
}

// ── Downloads ─────────────────────────────────────────────────────────────────

function DownloadsTab({ orders }: { orders: LibraryOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <EmptyState
          icon={<Download size={32} />}
          title="No downloads yet"
          description="Digital products and bundles you purchase will appear here."
          action={
            <Link href="/marketplace">
              <Button size="sm">Browse Marketplace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                <FileText size={16} className="text-neutral-500" />
              </div>
              <div>
                <p className="font-semibold text-black">{order.productName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Purchased {formatDate(order.createdAt)} · {formatCurrency(order.amount)}
                </p>
              </div>
            </div>
            <StatusBadge status={order.paymentStatus === 'paid' ? 'paid' : order.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {order.paymentStatus === 'paid' ? (
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Access granted — download delivery will be served via signed links.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Payment pending — files will be available once confirmed.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

function SubscriptionsTab({ subscriptions }: { subscriptions: LibrarySubscription[] }) {
  if (subscriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <EmptyState
          icon={<Repeat2 size={32} />}
          title="No subscriptions yet"
          description="Recurring memberships will appear here once you subscribe."
          action={
            <Link href="/marketplace">
              <Button size="sm">Browse Marketplace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-black">{sub.productName}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {formatCurrency(sub.amount, sub.currency)} / period
                {sub.currentPeriodEnd
                  ? ` · Renews ${formatDate(sub.currentPeriodEnd)}`
                  : ''}
              </p>
            </div>
            <StatusBadge status={sub.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sub.productSlug && (
              <Link href={`/p/${sub.productSlug}`}>
                <Button size="xs" variant="ghost">
                  <ExternalLink size={12} /> View Product
                </Button>
              </Link>
            )}
            {sub.status === 'active' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 size={12} />
                Access active
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Coaching ──────────────────────────────────────────────────────────────────

function CoachingTab({ orders }: { orders: LibraryOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <EmptyState
          icon={<Star size={32} />}
          title="No coaching sessions yet"
          description="Coaching calls and service offers you purchase will appear here."
          action={
            <Link href="/marketplace">
              <Button size="sm">Browse Coaching</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
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
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Access granted — contact the seller to schedule your session.
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Updates ───────────────────────────────────────────────────────────────────

function UpdatesTab() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
      <EmptyState
        icon={<Rss size={32} />}
        title="No updates yet"
        description="When sellers post buyer-only updates for products you own, they'll appear here."
        action={
          <Link href="/marketplace">
            <Button size="sm">Browse Products</Button>
          </Link>
        }
      />
    </div>
  )
}

// ── Support ───────────────────────────────────────────────────────────────────

function SupportTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-black">
            <HeadphonesIcon size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-black">Need help with a purchase?</h3>
            <p className="mt-1 text-sm text-neutral-500">
              For questions about your downloads, access, or orders — reach out to the seller
              directly or contact SellBop support.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="mailto:support@sellbop.com">
                <Button size="sm" variant="secondary">
                  <Mail size={13} /> Email Support
                </Button>
              </a>
              <Link href="/marketplace">
                <Button size="sm" variant="ghost">Browse Marketplace</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 text-sm text-neutral-500">
        <p className="font-medium text-black">Common answers</p>
        <ul className="mt-2 space-y-1.5 text-xs">
          <li>· Download links are sent to your email after purchase</li>
          <li>· Subscriptions can be managed from the Subscriptions tab</li>
          <li>· For coaching sessions, contact the seller after payment</li>
          <li>· Refund requests: email support@sellbop.com within 30 days</li>
        </ul>
      </div>
    </div>
  )
}
