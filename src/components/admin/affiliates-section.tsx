import Link from 'next/link'
import type { AdminAffiliateSummary } from '@/lib/admin/affiliates'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

export function AffiliatesSection({
  affiliates,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  affiliates: AdminAffiliateSummary[]
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
          <h1 className="text-xl font-bold text-black">Affiliates</h1>
          <p className="text-sm text-neutral-400">{total} relationships</p>
        </div>
        <AdminFilterBar
          section="affiliates"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Affiliate</AdminTH>
                <AdminTH>Product</AdminTH>
                <AdminTH>Code</AdminTH>
                <AdminTH>Commission</AdminTH>
                <AdminTH>Clicks</AdminTH>
                <AdminTH>Orders</AdminTH>
                <AdminTH>Earned</AdminTH>
                <AdminTH>Status</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {affiliates.length === 0 && <AdminEmptyState label="affiliate relationships" colSpan={9} />}
              {affiliates.map((affiliate) => (
                <tr key={affiliate.relationshipId} className="transition-colors hover:bg-neutral-50">
                  <AdminTD>
                    <div>
                      <p className="font-medium text-black">{affiliate.affiliateName ?? 'Affiliate'}</p>
                      <p className="text-[11px] text-neutral-400">{affiliate.affiliateEmail ?? affiliate.affiliateUserId}</p>
                    </div>
                  </AdminTD>
                  <AdminTD>{affiliate.productTitle}</AdminTD>
                  <AdminTD className="font-mono text-xs">{affiliate.referralCode}</AdminTD>
                  <AdminTD>{affiliate.commissionPercent ?? 0}%</AdminTD>
                  <AdminTD>{affiliate.clickCount}</AdminTD>
                  <AdminTD>{affiliate.orderCount}</AdminTD>
                  <AdminTD className="font-semibold text-black">{formatCurrency(affiliate.commissionEarnedCents)}</AdminTD>
                  <AdminTD className="capitalize">{affiliate.status}</AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/affiliates/${affiliate.relationshipId}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="affiliates" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}
