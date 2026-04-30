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

interface ProductFile {
  id: string
  product_id: string
  file_name: string
  file_url: string
  file_type: string
  visibility: string
}

interface ProductUpdate {
  id: string
  product_id: string
  title: string
  body: string
  link_url: string | null
  link_label: string | null
  created_at: string
}

interface LibraryOrder {
  id: string
  productId: string | null
  productSlug: string | null
  productName: string
  productType?: string | null
  productFiles?: ProductFile[]
  productUpdates?: ProductUpdate[]
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
        <UpdatesTab orders={orders} />
      ) : (
        <SupportTab />
      )}
    </div>
  )
}

function fileTypeIcon(type: string) {
  switch (type) {
    case 'pdf': return '📄'
    case 'zip': return '🗜️'
    case 'video': return '🎬'
    case 'audio': return '🎵'
    case 'image': return '🖼️'
    case 'link': return '🔗'
    default: return '📁'
  }
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
            <div className="flex items-center gap-2">
              {order.productSlug && (
                <Link href={`/p/${order.productSlug}`}>
                  <Button size="xs" variant="ghost">
                    <ExternalLink size={12} /> View
                  </Button>
                </Link>
              )}
              <StatusBadge status={order.paymentStatus === 'paid' ? 'paid' : order.status} />
            </div>
          </div>

          {/* Product files */}
          {order.paymentStatus === 'paid' && (order.productFiles ?? []).length > 0 ? (
            <div className="mt-4 space-y-2">
              {(order.productFiles ?? []).map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm hover:border-neutral-400 hover:bg-white transition-colors"
                >
                  <span className="text-base leading-none">{fileTypeIcon(file.file_type)}</span>
                  <span className="flex-1 font-medium text-black truncate">{file.file_name}</span>
                  <Download size={13} className="shrink-0 text-neutral-400" />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {order.paymentStatus === 'paid' ? (
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Access granted — contact the seller for download links.
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Payment pending — files will be available once confirmed.
                </div>
              )}
            </div>
          )}
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

function UpdatesTab({ orders }: { orders: LibraryOrder[] }) {
  const allUpdates = orders
    .flatMap((o) => (o.productUpdates ?? []).map((u) => ({ ...u, productName: o.productName, productSlug: o.productSlug })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  if (allUpdates.length === 0) {
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

  return (
    <div className="space-y-3">
      {allUpdates.map((update) => (
        <div key={update.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-black text-sm">{update.title}</p>
                <span className="text-[10px] font-medium text-neutral-400">from {update.productName}</span>
              </div>
              {update.body && (
                <p className="text-sm text-neutral-600 leading-relaxed">{update.body}</p>
              )}
              {update.link_url && (
                <a
                  href={update.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-black underline underline-offset-2 hover:no-underline"
                >
                  <ExternalLink size={11} />
                  {update.link_label ?? update.link_url}
                </a>
              )}
              <p className="mt-2 text-xs text-neutral-400">{formatDate(update.created_at)}</p>
            </div>
            {update.productSlug && (
              <Link href={`/p/${update.productSlug}`}>
                <Button size="xs" variant="ghost">
                  <ExternalLink size={12} /> Product
                </Button>
              </Link>
            )}
          </div>
        </div>
      ))}
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
