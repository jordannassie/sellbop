import { formatCurrency } from '@/lib/utils'
import type { AdminOverviewData } from '@/lib/admin/users'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="text-2xl font-bold leading-none text-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  )
}

export function AdminOverview({ data }: { data: AdminOverviewData }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-black">Overview</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Platform-wide summary powered by Supabase.</p>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Platform</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total Users" value={data.totalUsers} sub="Shared identity" />
          <Stat label="Sellers" value={data.totalSellers} sub="Own a store" />
          <Stat label="Buyers" value={data.totalBuyers} sub="Orders or subscriptions" />
          <Stat label="Orders" value={data.totalOrders} sub="All time" />
          <Stat label="Active Subs" value={data.activeSubscriptions} sub="Currently billing" />
          <Stat label="Gross Revenue" value={formatCurrency(data.grossRevenueCents)} sub="Paid orders" />
        </div>
      </div>
    </div>
  )
}
