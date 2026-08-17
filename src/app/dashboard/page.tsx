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
  Store,
  Users,
  Wand2,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { LaunchDashboard } from '@/components/dashboard/launch-dashboard'
import { AICreditsPill } from '@/components/dashboard/ai-credits-pill'
import { GettingStartedCard } from '@/components/dashboard/getting-started-card'
import { useLaunchChecklist } from '@/hooks/use-launch-checklist'
import { useDemoMode } from '@/hooks/use-demo-mode'
import { getLaunchIdea, clearLaunchIdea } from '@/lib/launch-idea'
import { isSupabaseConfigured } from '@/lib/env'

interface OrderRow {
  id: string
  buyer_email: string | null
  total_cents: number
  payment_status: string
  created_at: string
  product_title_snapshot: string | null
}

interface ProductRow {
  id: string
  title: string
  slug: string
  price_cents: number | null
  is_live: boolean
  sales_count: number
}

function statusVariant(status: string) {
  return status === 'paid' || status === 'completed' ? 'success'
    : status === 'refunded' ? 'warning'
    : status === 'failed' ? 'danger'
    : 'neutral'
}

export default function DashboardOverview() {
  const router = useRouter()
  const { session, account, loading: authLoading } = useAuth()
  const { store, loading: storeLoading } = useUserStore()
  const { demoMode, ready } = useDemoMode()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const { checklist, isLaunched } = useLaunchChecklist()
  const hasStore = !!(account?.hasStore || store)

  useEffect(() => {
    if (authLoading || !session) return
    const idea = getLaunchIdea()
    if (!idea) return
    clearLaunchIdea()
    router.push(`/dashboard/ai-launch?idea=${encodeURIComponent(idea)}`)
  }, [authLoading, session, router])

  useEffect(() => {
    if (storeLoading) return
    if (!hasStore) {
      router.replace('/dashboard/library')
    }
  }, [storeLoading, hasStore, router])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (authLoading || !ready) return

    if (demoMode || !session) {
      const sid = DEMO_SELLER_PROFILE.id
      Promise.all([
        demoOrderRepo.findAll(sid),
        demoProductRepo.findAll(sid),
        demoCustomerRepo.findAll(sid),
      ]).then(([o, p, c]) => {
        setOrders(o.map(order => ({
          id: order.id,
          buyer_email: order.customerEmail,
          total_cents: Math.round(order.amount * 100),
          payment_status: order.paymentStatus,
          created_at: order.createdAt,
          product_title_snapshot: order.productName,
        })))
        setProducts(p.map(product => ({
          id: product.id,
          title: product.name,
          slug: product.slug,
          price_cents: Math.round(product.price * 100),
          is_live: product.status === 'published',
          sales_count: product.salesCount,
        })))
        setCustomerCount(c.length)
        setLoading(false)
      })
      return
    }

    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      fetch('/api/orders').then(r => r.ok ? r.json() : { orders: [] }),
      fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }),
      fetch('/api/customers').then(r => r.ok ? r.json() : { customers: [] }),
    ]).then(([ordersData, productsData, customersData]) => {
      setOrders(ordersData.orders ?? [])
      setProducts(productsData.products ?? [])
      setCustomerCount((customersData.customers ?? []).length)
    }).catch(() => {
      setOrders([])
      setProducts([])
      setCustomerCount(0)
    }).finally(() => setLoading(false))
  }, [authLoading, demoMode, ready, session])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      const d = sessionStorage.getItem('launch_dashboard_dismissed')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d === 'true') setDismissed(true)
    } catch { /* storage unavailable */ }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem('launch_dashboard_dismissed', 'true')
    } catch { /* storage unavailable */ }
  }

  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  const totalRevenueCents = paidOrders.reduce((s, o) => s + (o.total_cents ?? 0), 0)
  const totalSales = paidOrders.length
  const publishedProducts = products.filter(p => p.is_live).length
  const recentOrders = orders.slice(0, 6)
  const topProducts = [...products].sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0)).slice(0, 4)

  const firstName = session?.name?.split(' ')[0] ?? session?.email?.split('@')[0] ?? ''
  const hasName = !!firstName
  const showLaunchCoach = !dismissed
  const allStatsZero = totalRevenueCents === 0 && totalSales === 0 && publishedProducts === 0 && customerCount === 0

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">
            {hasName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {hasName
              ? 'Ready to turn what you know into something you can sell?'
              : 'Ready to create your first product with AI?'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <AICreditsPill />
          {isLaunched && (
            <Badge variant="success" className="hidden sm:flex">Live</Badge>
          )}
        </div>
      </div>

      {showLaunchCoach && (
        <LaunchDashboard
          userName={hasName ? firstName : undefined}
          onDismiss={checklist.storePublished ? handleDismiss : undefined}
        />
      )}

      <GettingStartedCard />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Business Snapshot
          </h2>
          {allStatsZero && (
            <p className="text-xs text-neutral-400 hidden sm:block">
              Your business is ready. Create your first product to start selling.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Revenue', value: formatCurrency(totalRevenueCents), icon: DollarSign, href: '/dashboard/sales' },
            { label: 'Sales', value: totalSales.toString(), icon: ShoppingBag, href: '/dashboard/orders' },
            { label: 'Products', value: publishedProducts.toString(), icon: Package, href: '/dashboard/products' },
            { label: 'Customers', value: customerCount.toString(), icon: Users, href: '/dashboard/customers' },
          ].map(stat => (
            <Link key={stat.label} href={stat.href}>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={13} className="text-neutral-400" />
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
                {loading ? (
                  <div className="h-7 w-16 bg-neutral-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-black">{stat.value}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        {allStatsZero && (
          <p className="text-xs text-neutral-400 mt-2 sm:hidden text-center">
            Your business is ready. Create your first product to start selling.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Link href="/dashboard/ai-launch">
          <div className="group rounded-2xl border-2 border-black bg-black p-6 text-white hover:bg-neutral-800 transition-colors cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Wand2 size={20} className="text-white" />
            </div>
            <p className="font-bold text-base mb-1">Create your first product</p>
            <p className="text-white/60 text-sm mb-4">Use your AI Launch Coach to build a product page, price, FAQ, and launch plan.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
              Create with AI <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/store">
          <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <Store size={20} className="text-neutral-600" />
            </div>
            <p className="font-bold text-base text-black mb-1">Customize your store</p>
            <p className="text-neutral-500 text-sm mb-4">Update your profile, brand, and public storefront.</p>
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
            <p className="text-neutral-500 text-sm mb-4">Track orders, revenue, and customer activity.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600 group-hover:text-black transition-colors">
              See Sales <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/dashboard/orders"><Button size="xs" variant="ghost">View all →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ShoppingBag size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No orders yet.</p>
                <p className="text-xs text-neutral-400 mb-4">Orders will appear here after your first sale.</p>
                <Link href="/dashboard/ai-launch">
                  <Button size="sm">
                    <Wand2 size={13} /> Create with AI
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentOrders.map(order => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{order.buyer_email}</p>
                        <p className="text-xs text-neutral-400">{order.product_title_snapshot ?? '—'} · {timeAgo(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusVariant(order.payment_status)}>{order.payment_status}</Badge>
                        <span className="text-sm font-semibold text-black">{formatCurrency(order.total_cents ?? 0)}</span>
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
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Package size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No products yet.</p>
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
                        <p className="text-sm font-medium text-neutral-900 truncate">{p.title}</p>
                        <p className="text-xs text-neutral-400">{formatCurrency(p.price_cents ?? 0)} · {p.sales_count ?? 0} sales</p>
                      </div>
                      <Badge variant={p.is_live ? 'success' : 'neutral'}>
                        {p.is_live ? 'Live' : 'Draft'}
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
