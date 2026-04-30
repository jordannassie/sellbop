'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoOrderRepo, demoProductRepo, demoCustomerRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  DollarSign,
  Package,
  Sparkles,
  Store,
  Users,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import type { Order, Product } from '@/lib/domain/entities'

function statusVariant(status: string) {
  return status === 'completed' ? 'success' : status === 'refunded' ? 'warning' : status === 'failed' ? 'danger' : 'neutral'
}

export default function DashboardOverview() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerCount, setCustomerCount] = useState(0)

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

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.amount, 0)
  const totalSales = orders.filter(o => o.paymentStatus === 'paid').length
  const publishedProducts = products.filter(p => p.status === 'published').length
  const recentOrders = orders.slice(0, 6)
  const topProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4)

  const firstName = session?.name?.split(' ')[0] ?? session?.email?.split('@')[0] ?? 'there'

  return (
    <div>
      {/* ── Welcome header ──────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Welcome back, {firstName}.</h1>
        <p className="mt-1 text-sm text-neutral-500">What do you want to do today?</p>
      </div>

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
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/dashboard/orders"><Button size="xs" variant="ghost">View all →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-neutral-400">
                No orders yet — share your store to get started.
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
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-neutral-400 mb-3">No products yet.</p>
                <Link href="/dashboard/products/new">
                  <Button size="sm" variant="secondary">Create Product</Button>
                </Link>
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

      {/* ── AI product builder nudge ─────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-100 bg-gradient-to-r from-neutral-50 to-white p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
            <Sparkles size={17} className="text-neutral-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-black">Create with AI</p>
            <p className="text-xs text-neutral-500">Generate a complete product page with one prompt.</p>
          </div>
        </div>
        <Link href="/dashboard/products/ai-builder">
          <Button size="sm" variant="secondary">Try AI Builder</Button>
        </Link>
      </div>
    </div>
  )
}
