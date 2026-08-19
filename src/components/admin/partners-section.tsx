import Link from 'next/link'
import type { PartnerApplicationSummary } from '@/lib/admin/partner-applications'
import { PARTNER_APPLICATION_STATUS_LABELS } from '@/lib/partner-applications/constants'
import { AUDIENCE_SIZE_OPTIONS } from '@/lib/partner-applications/constants'
import { formatDate } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

function statusBadge(status: PartnerApplicationSummary['status']) {
  const colors: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700',
    contacted: 'bg-amber-50 text-amber-700',
    reviewing: 'bg-violet-50 text-violet-700',
    approved: 'bg-emerald-50 text-emerald-700',
    declined: 'bg-neutral-100 text-neutral-600',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors[status] ?? colors.new}`}>
      {PARTNER_APPLICATION_STATUS_LABELS[status]}
    </span>
  )
}

export function PartnersSection({
  applications,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  applications: PartnerApplicationSummary[]
  page: number
  totalPages: number
  total: number
  q?: string
  filter?: string
}) {
  const audienceFilters = AUDIENCE_SIZE_OPTIONS.map(option => ({
    value: option,
    label: option,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">Partners</h1>
          <p className="text-sm text-neutral-400">{total} application{total !== 1 ? 's' : ''}</p>
        </div>
        <AdminFilterBar
          section="partners"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New' },
            { value: 'contacted', label: 'Contacted' },
            { value: 'reviewing', label: 'Reviewing' },
            { value: 'approved', label: 'Approved' },
            { value: 'declined', label: 'Declined' },
            ...audienceFilters,
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Name</AdminTH>
                <AdminTH>Audience</AdminTH>
                <AdminTH>Email</AdminTH>
                <AdminTH>Status</AdminTH>
                <AdminTH>Submitted</AdminTH>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <AdminEmptyState colSpan={5} label="partner applications" />
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                    <AdminTD>
                      <Link href={`/internal/admin/partners/${app.id}`} className="font-medium text-black hover:underline">
                        {app.name}
                      </Link>
                    </AdminTD>
                    <AdminTD>
                      <span className="text-neutral-600">{app.audienceSize}</span>
                    </AdminTD>
                    <AdminTD>
                      <span className="text-neutral-600">{app.email}</span>
                    </AdminTD>
                    <AdminTD>{statusBadge(app.status)}</AdminTD>
                    <AdminTD>
                      <span className="text-neutral-500 whitespace-nowrap">{formatDate(app.createdAt)}</span>
                    </AdminTD>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination section="partners" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
    </div>
  )
}
