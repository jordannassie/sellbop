'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoOrderRepo, demoProductRepo, demoCustomerRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, getDemoRevenueChartData } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, ShoppingBag, Package, Users, TrendingUp } from 'lucide-react'
import type { Order, Product } from '@/lib/domain/entities'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StoreIdentityCard } from '@/components/dashboard/store-identity-card'

export default function DashboardOverview() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const chartData = getDemoRevenueChartData()

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
  const thisMonth = orders.filter(o => {
    const d = new Date(o.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, o) => s + o.amount, 0)
  const publishedProducts = products.filter(p => p.status === 'published').length
  const recentOrders = orders.slice(0, 8)

  function statusVariant(status: string) {
    return status === 'completed' ? 'success' : status === 'refunded' ? 'warning' : status === 'failed' ? 'danger' : 'neutral'
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Overview</h1>
          <p className="text-neutral-500 text-sm mt-1">Welcome back, {DEMO_SELLER_PROFILE.displayName}.</p>
        </div>
        <Link href="/dashboard/products/new"><Button size="sm">+ New Product</Button></Link>
      </div>

      {/* Store identity banner */}
      <StoreIdentityCard className="mb-8" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} change="+12% vs last month" positive icon={<DollarSign size={14} />} />
        <StatCard label="Total Sales" value={orders.filter(o => o.paymentStatus === 'paid').length.toString()} change="+5 this week" positive icon={<ShoppingBag size={14} />} />
        <StatCard label="This Month" value={formatCurrency(thisMonth)} icon={<TrendingUp size={14} />} />
        <StatCard label="Products" value={publishedProducts.toString()} icon={<Package size={14} />} />
        <StatCard label="Customers" value={customerCount.toString()} icon={<Users size={14} />} />
      </div>

      {/* Revenue chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue — last 7 months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 100).toFixed(0)}`} width={45} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/dashboard/orders"><Button size="xs" variant="ghost">View all →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <Link href="/dashboard/products"><Button size="xs" variant="ghost">Manage →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-50">
              {products.sort((a, b) => b.salesCount - a.salesCount).slice(0, 5).map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-400">{formatCurrency(p.price)} · {p.salesCount} sales</p>
                  </div>
                  <Badge variant={p.status === 'published' ? 'success' : 'neutral'}>
                    {p.status === 'published' ? 'Live' : p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
