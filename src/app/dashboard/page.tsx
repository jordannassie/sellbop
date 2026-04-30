'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoOrderRepo, demoProductRepo, demoCustomerRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Wand2,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { LaunchDashboard } from '@/components/dashboard/launch-dashboard'
import { useLaunchChecklist } from '@/hooks/use-launch-checklist'
import type { Order, Product } from '@/lib/domain/entities'

function statusVariant(status: string) {
  return status === 'completed' ? 'success' : status === 'refunded' ? 'warning' : status === 'failed' ? 'danger' : 'neutral'
}

// ── Quick actions for the AI assistant mini-bar (shown when launched) ─────────

const QUICK_ACTIONS = [
  { label: 'Create product', prompt: 'I want to create a new digital product' },
  { label: 'Improve my store', prompt: 'Help me improve my store and make it look more professional' },
  { label: 'Write copy', prompt: 'Help me write compelling copy for my product' },
  { label: 'Create subscription', prompt: 'I want to create a membership or subscription product' },
  { label: 'Get more sales', prompt: 'Help me get more sales and grow my revenue' },
]

function AIAssistantBar() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  function launch(text?: string) {
    const q = (text ?? prompt).trim()
    router.push(q ? `/dashboard/ai-launch?prompt=${encodeURIComponent(q)}` : '/dashboard/ai-launch')
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={14} className="text-neutral-500" />
        <p className="text-xs font-semibold text-neutral-600">AI Launch Assistant</p>
      </div>
      <div className="flex gap-2 mb-2.5">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && launch()}
          placeholder="What would you like to sell?"
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors"
        />
        <Button onClick={() => launch()} size="sm">
          <Sparkles size={12} /> Generate
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => launch(action.prompt)}
            className={cn(
              'rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:border-black hover:text-black',
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard overview ────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const { checklist, isLaunched, percentComplete } = useLaunchChecklist()

  useEffect(() => {
    const sid = DEMO_SELLER_PROFILE.id
    Promise.all([
      demoOrderRepo.findAll(sid),
      demoProductRepo.findAll(sid),
      demoCustomerRepo.findAll(sid),
    ]).then(([o, p, c]) => {
      setOrders(o)
      setProducts(p)
      setCustomerCount(c.length)
    })
  }, [])

  // Read dismiss from session storage so it persists per session but resets on new session
  useEffect(() => {
    try {
      const d = sessionStorage.getItem('launch_dashboard_dismissed')
      if (d === 'true') setDismissed(true)
    } catch { /* storage unavailable */ }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem('launch_dashboard_dismissed', 'true')
    } catch { /* storage unavailable */ }
  }

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.amount, 0)
  const totalSales = orders.filter(o => o.paymentStatus === 'paid').length
  const publishedProducts = products.filter(p => p.status === 'published').length
  const recentOrders = orders.slice(0, 6)
  const topProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4)

  // Determine display name from real auth session, fall back to demo
  const firstName = session?.name?.split(' ')[0] ?? session?.email?.split('@')[0] ?? 'there'

  // Show launch dashboard when: not dismissed, not fully launched OR checklist is incomplete
  const showLaunchDashboard = !dismissed && percentComplete < 80

  return (
    <div>
      {/* ── Welcome header ──────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Welcome back, {firstName}.</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isLaunched
              ? 'Your store is live. Keep creating and growing.'
              : 'Your store is almost ready. Complete the steps below to launch.'}
          </p>
        </div>
        {isLaunched && (
          <Badge variant="success" className="hidden sm:flex">Live</Badge>
        )}
      </div>

      {/* ── Launch Dashboard (for new / incomplete users) ─────── */}
      {showLaunchDashboard && (
        <LaunchDashboard
          userName={firstName !== 'there' ? firstName : undefined}
          onDismiss={checklist.storePublished ? handleDismiss : undefined}
        />
      )}

      {/* ── AI assistant mini-bar (shown after launch) ───────── */}
      {!showLaunchDashboard && (
        <AIAssistantBar />
      )}

      {/* ── Action cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Link href="/dashboard/products/new">
          <div className="group rounded-2xl border-2 border-black bg-black p-6 text-white hover:bg-neutral-800 transition-colors cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Package size={20} className="text-white" />
            </div>
            <p className="font-bold text-base mb-1">Create a product</p>
            <p className="text-white/60 text-sm mb-4">Launch a new digital product, course, or service.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
              Get started <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/store">
          <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <Store size={20} className="text-neutral-600" />
            </div>
            <p className="font-bold text-base text-black mb-1">Customize your store</p>
            <p className="text-neutral-500 text-sm mb-4">Update your brand, layout, and banner.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600 group-hover:text-black transition-colors">
              Open Store <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/sales">
          <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <BarChart3 size={20} className="text-neutral-600" />
            </div>
            <p className="font-bold text-base text-black mb-1">View your sales</p>
            <p className="text-neutral-500 text-sm mb-4">Orders, revenue, and customer insights.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600 group-hover:text-black transition-colors">
              See sales <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, href: '/dashboard/sales' },
          { label: 'Total Sales', value: totalSales.toString(), icon: ShoppingBag, href: '/dashboard/orders' },
          { label: 'Products', value: publishedProducts.toString(), icon: Package, href: '/dashboard/products' },
          { label: 'Customers', value: customerCount.toString(), icon: Users, href: '/dashboard/customers' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={13} className="text-neutral-400" />
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-black">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent orders + Top products ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/dashboard/orders"><Button size="xs" variant="ghost">View all →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ShoppingBag size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No orders yet</p>
                <p className="text-xs text-neutral-400 mb-4">Orders will appear here after your first sale.</p>
                <Link href="/dashboard/store">
                  <Button size="sm" variant="secondary">
                    <Store size={13} /> Share your store
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentOrders.map(order => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{order.customerEmail}</p>
                        <p className="text-xs text-neutral-400">{order.productName} · {timeAgo(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        <span className="text-sm font-semibold text-black">{formatCurrency(order.amount)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <Link href="/dashboard/products"><Button size="xs" variant="ghost">Manage →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Package size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No products yet</p>
                <p className="text-xs text-neutral-400 mb-4">Create your first product to start selling.</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Link href="/dashboard/ai-launch">
                    <Button size="sm">
                      <Wand2 size={13} /> Create with AI
                    </Button>
                  </Link>
                  <Link href="/dashboard/products/new">
                    <Button size="sm" variant="secondary">Create manually</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {topProducts.map(p => (
                  <Link key={p.id} href={`/dashboard/products/${p.id}`}>
                    <div className="px-6 py-3 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                        <p className="text-xs text-neutral-400">{formatCurrency(p.price)} · {p.salesCount} sales</p>
                      </div>
                      <Badge variant={p.status === 'published' ? 'success' : 'neutral'}>
                        {p.status === 'published' ? 'Live' : p.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
