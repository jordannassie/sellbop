import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { AdminOverviewData } from '@/lib/admin/users'
import { DemoModeToggle } from './demo-mode-toggle'
import { SaleSourceBadge } from '@/components/admin/admin-table'

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
        <p className="mt-0.5 text-sm text-neutral-500">Live SellBop platform metrics from production Supabase.</p>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Platform</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total Users" value={data.totalUsers} />
          <Stat label="Sellers" value={data.totalSellers} />
          <Stat label="Buyers" value={data.totalBuyers} sub={`${data.totalGuestBuyers} guest`} />
          <Stat label="Products" value={data.totalProducts} sub={`${data.activeProducts} active`} />
          <Stat label="Orders" value={data.totalOrders} />
          <Stat label="Purchases" value={data.totalPurchases} />
          <Stat label="Active Subs" value={data.activeSubscriptions} />
          <Stat label="Free acquisitions" value={data.freeAcquisitionsCount} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Revenue</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Gross sales" value={formatCurrency(data.grossSalesCents)} />
          <Stat label="SellBop platform revenue" value={formatCurrency(data.platformRevenueCents)} />
          <Stat label="Seller revenue" value={formatCurrency(data.sellerRevenueCents)} />
          <Stat label="Affiliate commissions" value={formatCurrency(data.affiliateCommissionsCents)} />
          <Stat label="Direct sales" value={data.directSalesCount} />
          <Stat label="Marketplace sales" value={data.marketplaceSalesCount} sub={formatCurrency(data.marketplaceGrossCents)} />
          <Stat label="Refunds" value={data.refundCount} sub={formatCurrency(data.refundedCents)} />
          <Stat label="Emails sent" value={data.emailsSent} sub={`${data.emailsFailed} failed/bounced`} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-5 py-4">
            <p className="text-sm font-bold text-black">Recent orders</p>
          </div>
          <div className="divide-y divide-neutral-50">
            {data.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400">No orders yet.</p>
            ) : data.recentOrders.map((order) => (
              <Link key={order.id} href={`/internal/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-black">{order.productName}</p>
                  <p className="text-xs text-neutral-400">{order.buyerEmail ?? 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(order.totalCents)}</p>
                  <SaleSourceBadge source={order.saleSource} hasAffiliate={order.hasAffiliate} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-5 py-4">
            <p className="text-sm font-bold text-black">Recent products</p>
          </div>
          <div className="divide-y divide-neutral-50">
            {data.recentProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400">No products yet.</p>
            ) : data.recentProducts.map((product) => (
              <Link key={product.id} href={`/internal/admin/products/${product.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-black">{product.title}</p>
                  <p className="text-xs text-neutral-400">{product.storeName ?? 'Unknown seller'}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(product.priceCents)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Settings</p>
        <div className="max-w-sm">
          <DemoModeToggle />
        </div>
      </div>
    </div>
  )
}
