import Link from 'next/link'
import type { AdminBuyerSummary } from '@/lib/admin/buyers'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

export function BuyersSection({
  buyers,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  buyers: AdminBuyerSummary[]
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
          <h1 className="text-xl font-bold text-black">Buyers</h1>
          <p className="text-sm text-neutral-400">{total} total · includes guest checkout emails</p>
        </div>
        <AdminFilterBar
          section="buyers"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'account', label: 'Has account' },
            { value: 'guest', label: 'Guest only' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Buyer</AdminTH>
                <AdminTH>Email</AdminTH>
                <AdminTH>Account</AdminTH>
                <AdminTH>Purchases</AdminTH>
                <AdminTH>Orders</AdminTH>
                <AdminTH>Total spent</AdminTH>
                <AdminTH>Last purchase</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {buyers.length === 0 && <AdminEmptyState label="buyers" colSpan={8} />}
              {buyers.map((buyer) => (
                <tr key={buyer.email} className="transition-colors hover:bg-neutral-50">
                  <AdminTD className="font-medium text-black">{buyer.name ?? 'Guest buyer'}</AdminTD>
                  <AdminTD className="text-neutral-600">{buyer.email}</AdminTD>
                  <AdminTD>{buyer.isGuest ? 'Guest' : 'Account'}</AdminTD>
                  <AdminTD>{buyer.purchaseCount}</AdminTD>
                  <AdminTD>{buyer.orderCount}</AdminTD>
                  <AdminTD className="font-semibold text-black">{formatCurrency(buyer.totalSpentCents)}</AdminTD>
                  <AdminTD className="text-neutral-400">
                    {buyer.lastPurchaseAt ? new Date(buyer.lastPurchaseAt).toLocaleDateString() : '—'}
                  </AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/buyers/${buyer.key}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="buyers" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}
