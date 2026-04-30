import Link from 'next/link'
import type { AdminSubscriptionSummary } from '@/lib/admin/users'
import { formatCurrency } from '@/lib/utils'

export function SubscriptionsSection({ subscriptions }: { subscriptions: AdminSubscriptionSummary[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Subscriptions</h1>
        <span className="text-sm text-neutral-400">{subscriptions.length} total</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Customer', 'Product', 'Amount', 'Status', 'Next Billing', ''].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm text-neutral-700">{subscription.customerEmail}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{subscription.productName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-black">
                    {subscription.amountCents != null
                      ? `${formatCurrency(subscription.amountCents, subscription.currency ?? 'usd')} / period`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{subscription.status}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/internal/admin/subscriptions/${subscription.id}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                    No subscriptions yet.
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
