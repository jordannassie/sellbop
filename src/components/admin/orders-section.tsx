import Link from 'next/link'
import type { AdminOrderSummary } from '@/lib/admin/orders'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH, RefundBadge, SaleSourceBadge } from '@/components/admin/admin-table'

export function OrdersSection({
  orders,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  orders: AdminOrderSummary[]
  page: number
  totalPages: number
  total: number
  q?: string
  filter?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">Orders</h1>
          <p className="text-sm text-neutral-400">{total} total</p>
        </div>
        <AdminFilterBar
          section="orders"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'direct', label: 'Direct' },
            { value: 'marketplace', label: 'Marketplace' },
            { value: 'affiliate', label: 'Affiliate' },
            { value: 'free', label: 'Free' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'partial', label: 'Partial refund' },
            { value: 'disputed', label: 'Disputed' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Date</AdminTH>
                <AdminTH>Buyer</AdminTH>
                <AdminTH>Seller</AdminTH>
                <AdminTH>Product</AdminTH>
                <AdminTH>Gross</AdminTH>
                <AdminTH>Discount</AdminTH>
                <AdminTH>Platform fee</AdminTH>
                <AdminTH>Affiliate</AdminTH>
                <AdminTH>Seller net</AdminTH>
                <AdminTH>Source</AdminTH>
                <AdminTH>Payment</AdminTH>
                <AdminTH>Refund</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.length === 0 && <AdminEmptyState label="orders" colSpan={13} />}
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-neutral-50">
                  <AdminTD className="whitespace-nowrap text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</AdminTD>
                  <AdminTD>
                    <div>
                      <p className="font-medium text-black">{order.buyerName ?? 'Guest'}</p>
                      <p className="text-[11px] text-neutral-400">{order.buyerEmail ?? '—'}</p>
                    </div>
                  </AdminTD>
                  <AdminTD className="text-neutral-600">{order.storeName ?? '—'}</AdminTD>
                  <AdminTD>{order.productName}</AdminTD>
                  <AdminTD className="font-semibold text-black">{formatCurrency(order.totalCents)}</AdminTD>
                  <AdminTD>{order.discountCents > 0 ? formatCurrency(order.discountCents) : '—'}</AdminTD>
                  <AdminTD>{formatCurrency(order.platformFeeCents)}</AdminTD>
                  <AdminTD>{order.affiliateCommissionCents > 0 ? formatCurrency(order.affiliateCommissionCents) : '—'}</AdminTD>
                  <AdminTD>{formatCurrency(order.sellerNetCents)}</AdminTD>
                  <AdminTD><SaleSourceBadge source={order.saleSource} hasAffiliate={order.hasAffiliate} /></AdminTD>
                  <AdminTD className="capitalize">{order.paymentStatus}</AdminTD>
                  <AdminTD><RefundBadge status={order.refundStatus} /></AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/orders/${order.id}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="orders" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}
