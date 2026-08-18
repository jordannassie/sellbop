import Link from 'next/link'

export function AdminTH({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
      {children}
    </th>
  )
}

export function AdminTD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
}

export function AdminEmptyState({ label, colSpan = 6 }: { label: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">No {label} yet</p>
      </td>
    </tr>
  )
}

export function AdminPagination({
  section,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  section: string
  page: number
  totalPages: number
  total: number
  q?: string
  filter?: string
}) {
  function href(targetPage: number) {
    const params = new URLSearchParams({ section, page: String(targetPage) })
    if (q) params.set('q', q)
    if (filter) params.set('filter', filter)
    return `/internal/admin?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
      <span>{total} total · page {page} of {totalPages}</span>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-lg border border-neutral-200 px-3 py-1.5 hover:bg-neutral-50">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className="rounded-lg border border-neutral-200 px-3 py-1.5 hover:bg-neutral-50">
            Next
          </Link>
        )}
      </div>
    </div>
  )
}

export function AdminFilterBar({
  section,
  q,
  filter,
  filters,
}: {
  section: string
  q?: string
  filter?: string
  filters?: { value: string; label: string }[]
}) {
  return (
    <form method="GET" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="section" value={section} />
      <input
        name="q"
        defaultValue={q ?? ''}
        placeholder="Search…"
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      />
      {filters && filters.length > 0 && (
        <select
          name="filter"
          defaultValue={filter ?? 'all'}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          {filters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      )}
      <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
        Apply
      </button>
    </form>
  )
}

export function SaleSourceBadge({ source, hasAffiliate }: { source: string; hasAffiliate?: boolean }) {
  const label = source === 'marketplace' ? 'Marketplace' : source === 'free' ? 'Free' : 'Direct'
  const color = source === 'marketplace'
    ? 'bg-violet-50 text-violet-700 border-violet-200'
    : source === 'free'
      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}>
        {label}
      </span>
      {hasAffiliate && (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          Affiliate
        </span>
      )}
    </span>
  )
}

export function RefundBadge({ status }: { status: string }) {
  if (!status || status === 'none') return <span className="text-neutral-400">—</span>
  const color = status === 'refunded'
    ? 'text-red-600'
    : status === 'partially_refunded'
      ? 'text-amber-600'
      : status === 'disputed'
        ? 'text-orange-600'
        : 'text-neutral-600'
  return <span className={`text-xs font-semibold capitalize ${color}`}>{status.replace('_', ' ')}</span>
}
