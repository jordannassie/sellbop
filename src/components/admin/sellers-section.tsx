import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { AdminSellerSummary } from '@/lib/admin/sellers'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

export function SellersSection({
  sellers,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  sellers: AdminSellerSummary[]
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
          <h1 className="text-xl font-bold text-black">Sellers</h1>
          <p className="text-sm text-neutral-400">{total} total</p>
        </div>
        <AdminFilterBar
          section="sellers"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'stripe', label: 'Stripe connected' },
            { value: 'no-stripe', label: 'Not connected' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Seller</AdminTH>
                <AdminTH>Store</AdminTH>
                <AdminTH>Stripe</AdminTH>
                <AdminTH>Products</AdminTH>
                <AdminTH>Orders</AdminTH>
                <AdminTH>Gross sales</AdminTH>
                <AdminTH>Platform fees</AdminTH>
                <AdminTH>Seller net</AdminTH>
                <AdminTH>Affiliate sales</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {sellers.length === 0 && <AdminEmptyState label="sellers" colSpan={10} />}
              {sellers.map((seller) => (
                <tr key={seller.storeId} className="transition-colors hover:bg-neutral-50">
                  <AdminTD>
                    <div>
                      <p className="font-medium text-black">{seller.fullName ?? seller.email.split('@')[0]}</p>
                      <p className="text-[11px] text-neutral-400">{seller.email}</p>
                    </div>
                  </AdminTD>
                  <AdminTD>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{seller.storeName}</span>
                      <Link href={`/${seller.storeSlug}`} target="_blank" className="text-neutral-400 hover:text-black">
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </AdminTD>
                  <AdminTD>{seller.stripeConnected ? (seller.stripeOnboardingComplete ? 'Ready' : 'Pending') : 'Not connected'}</AdminTD>
                  <AdminTD>{seller.productCount}</AdminTD>
                  <AdminTD>{seller.orderCount}</AdminTD>
                  <AdminTD className="font-semibold text-black">{formatCurrency(seller.grossSalesCents)}</AdminTD>
                  <AdminTD>{formatCurrency(seller.platformFeesCents)}</AdminTD>
                  <AdminTD>{formatCurrency(seller.sellerNetCents)}</AdminTD>
                  <AdminTD>{seller.affiliateSalesCount}</AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/users/${seller.userId}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="sellers" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}
