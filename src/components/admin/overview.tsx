'use client'

import {
  DEMO_USERS, DEMO_CUSTOMERS, DEMO_PRODUCTS, DEMO_ORDERS,
  DEMO_SUBSCRIPTIONS, DEMO_ANALYTICS_EVENTS, getDemoRevenueChartData,
} from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Stat card ────────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-black leading-none">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-black mb-4">{title}</p>
      {children}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const revenueData = getDemoRevenueChartData()

const sourceData = [
  { source: 'Direct',    visits: 42 },
  { source: 'Twitter',   visits: 28 },
  { source: 'Google',    visits: 15 },
  { source: 'Instagram', visits: 10 },
  { source: 'Other',     visits: 5  },
]

const topProducts = DEMO_PRODUCTS
  .map(p => ({ name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name, sales: p.salesCount ?? 0, views: p.viewCount ?? 0 }))
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 5)

// ─── Overview page ────────────────────────────────────────────────────────────

export function AdminOverview() {
  const totalUsers     = DEMO_USERS.length + DEMO_CUSTOMERS.length
  const totalSellers   = DEMO_USERS.filter(u => u.role === 'creator').length
  const totalBuyers    = DEMO_USERS.filter(u => u.role === 'buyer').length + DEMO_CUSTOMERS.length
  const totalProducts  = DEMO_PRODUCTS.length
  const totalOrders    = DEMO_ORDERS.length
  const activeSubs     = DEMO_SUBSCRIPTIONS.filter(s => s.status === 'active').length
  const refundedOrders = DEMO_ORDERS.filter(o => o.paymentStatus === 'refunded').length
  const totalRevenue   = DEMO_ORDERS.reduce((s, o) => s + o.amount, 0)

  const views     = DEMO_ANALYTICS_EVENTS.filter(e => e.eventType === 'product_view').length
  const checkouts = DEMO_ANALYTICS_EVENTS.filter(e => e.eventType === 'checkout_started').length
  const purchases = DEMO_ANALYTICS_EVENTS.filter(e => e.eventType === 'purchase_completed').length
  const convRate  = checkouts > 0 ? ((purchases / checkouts) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-black">Overview</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Platform-wide summary · Demo data</p>
      </div>

      {/* Platform stats */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Platform</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total Users"    value={totalUsers}   sub="All roles" />
          <Stat label="Sellers"        value={totalSellers} sub="Creator accounts" />
          <Stat label="Buyers"         value={totalBuyers}  sub="Customer accounts" />
          <Stat label="Products"       value={totalProducts} sub="All types" />
          <Stat label="Total Orders"   value={totalOrders}  sub="All time" />
          <Stat label="Active Subs"    value={activeSubs}   sub="Currently billing" />
          <Stat label="Refunded"       value={refundedOrders} sub="Orders refunded" />
          <Stat label="Gross Revenue"  value={formatCurrency(totalRevenue)} sub="Before fees" />
        </div>
      </div>

      {/* Revenue chart */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Revenue</p>
        <ChartCard title="Monthly revenue — last 7 months">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#000" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 100).toFixed(0)}`}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000"
                  strokeWidth={2}
                  fill="url(#adminRevGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Analytics stats + traffic */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Analytics — last 30 days</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <Stat label="Page Views"      value={views}          sub="Product views" />
          <Stat label="Checkout Starts" value={checkouts}      sub="Sessions started" />
          <Stat label="Purchases"       value={purchases}      sub="Completed" />
          <Stat label="Conversion"      value={`${convRate}%`} sub="Checkout → purchase" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Traffic sources */}
          <ChartCard title="Traffic sources">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={68}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <Bar dataKey="visits" fill="#000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top products */}
          <ChartCard title="Top products by sales">
            <div className="divide-y divide-neutral-50">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-neutral-300 w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-neutral-700 truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-xs text-neutral-400">{p.views} views</span>
                    <span className="text-sm font-semibold text-black">{p.sales} sales</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
