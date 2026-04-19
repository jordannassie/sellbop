'use client'
import { useState, useEffect } from 'react'
import { demoAnalyticsRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, DEMO_PRODUCTS, getDemoRevenueChartData } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Eye, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { AnalyticsEvent } from '@/lib/domain/entities'

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const chartData = getDemoRevenueChartData()

  useEffect(() => {
    demoAnalyticsRepo.findBySellerId(DEMO_SELLER_PROFILE.id, { days: 30 }).then(setEvents)
  }, [])

  const views = events.filter(e => e.eventType === 'product_view').length
  const checkouts = events.filter(e => e.eventType === 'checkout_started').length
  const purchases = events.filter(e => e.eventType === 'purchase_completed').length
  const convRate = checkouts > 0 ? ((purchases / checkouts) * 100).toFixed(1) : '0'

  const topProducts = DEMO_PRODUCTS.map(p => ({ name: p.name.slice(0, 20), sales: p.salesCount, views: p.viewCount }))
    .sort((a, b) => b.sales - a.sales).slice(0, 5)

  const sourceData = [
    { source: 'Direct', visits: 42 },
    { source: 'Twitter', visits: 28 },
    { source: 'Google', visits: 15 },
    { source: 'Instagram', visits: 10 },
    { source: 'Other', visits: 5 },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Analytics</h1>
        <p className="text-neutral-500 text-sm mt-1">Last 30 days · Demo data</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Page Views" value={views.toLocaleString()} change="+18% vs last month" positive icon={<Eye size={14} />} />
        <StatCard label="Checkout Starts" value={checkouts.toString()} change="+7% vs last month" positive icon={<ShoppingCart size={14} />} />
        <StatCard label="Purchases" value={purchases.toString()} icon={<DollarSign size={14} />} />
        <StatCard label="Conversion Rate" value={`${convRate}%`} change="+2.1% vs last month" positive icon={<TrendingUp size={14} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Revenue over time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 100).toFixed(0)}`} width={45} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} fill="url(#ag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Traffic sources</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <Bar dataKey="visits" fill="#000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {['Product', 'Views', 'Sales', 'Conv. Rate'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {topProducts.map(p => (
                  <tr key={p.name}>
                    <td className="px-6 py-3 font-medium text-neutral-900">{p.name}</td>
                    <td className="px-6 py-3 text-neutral-600">{p.views.toLocaleString()}</td>
                    <td className="px-6 py-3 text-neutral-600">{p.sales}</td>
                    <td className="px-6 py-3 text-neutral-600">{p.views > 0 ? ((p.sales / p.views) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
