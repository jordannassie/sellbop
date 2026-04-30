import Link from 'next/link'
import type { AdminOrderSummary } from '@/lib/admin/users'
import { formatCurrency } from '@/lib/utils'

export function OrdersSection({ orders }: { orders: AdminOrderSummary[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Orders</h1>
        <span className="text-sm text-neutral-400">{orders.length} total</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Buyer', 'Product', 'Amount', 'Status', 'Payment', 'Date', ''].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-black">{order.buyerName ?? 'Guest checkout'}</p>
                      <p className="text-[11px] text-neutral-400">{order.buyerEmail ?? 'No email'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{order.productName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-black">{formatCurrency(order.totalCents)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.status}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.paymentStatus}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/internal/admin/orders/${order.id}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-neutral-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
