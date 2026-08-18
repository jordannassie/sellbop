import Link from 'next/link'
import type { AdminUserSummary } from '@/lib/admin/users'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <img src={url} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
  }
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

function nameFor(user: AdminUserSummary) {
  return user.fullName ?? user.email.split('@')[0]
}

function UserLink({ user }: { user: AdminUserSummary }) {
  const displayName = nameFor(user)
  return (
    <Link href={`/internal/admin/users/${user.userId}`} className="flex items-center gap-3">
      <Avatar name={displayName} url={user.avatarUrl} />
      <div>
        <p className="whitespace-nowrap font-medium text-black">{displayName}</p>
        <p className="font-mono text-[11px] text-neutral-400">{user.userId.slice(0, 8)}…</p>
      </div>
    </Link>
  )
}

export function UsersSection({
  users,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  users: AdminUserSummary[]
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
          <h1 className="text-xl font-bold text-black">Users</h1>
          <p className="text-sm text-neutral-400">{total} total</p>
        </div>
        <AdminFilterBar
          section="users"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'sellers', label: 'Sellers' },
            { value: 'buyers', label: 'Buyers' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>User</AdminTH>
                <AdminTH>Email</AdminTH>
                <AdminTH>Seller</AdminTH>
                <AdminTH>Buyer</AdminTH>
                <AdminTH>Products</AdminTH>
                <AdminTH>Orders</AdminTH>
                <AdminTH>Spent / Sales</AdminTH>
                <AdminTH>Joined</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.length === 0 && <AdminEmptyState label="users" colSpan={9} />}
              {users.map((user) => (
                <tr key={user.userId} className="transition-colors hover:bg-neutral-50">
                  <AdminTD><UserLink user={user} /></AdminTD>
                  <AdminTD className="whitespace-nowrap text-neutral-500">{user.email}</AdminTD>
                  <AdminTD>{user.isSeller ? 'Yes' : 'No'}</AdminTD>
                  <AdminTD>{user.isBuyer ? 'Yes' : 'No'}</AdminTD>
                  <AdminTD>{user.productCount}</AdminTD>
                  <AdminTD>{user.orderCount}</AdminTD>
                  <AdminTD>
                    <div className="text-xs">
                      <p>Spent {formatCurrency(user.totalSpentCents)}</p>
                      {user.isSeller && <p className="text-neutral-400">Sales {formatCurrency(user.totalSalesCents)}</p>}
                    </div>
                  </AdminTD>
                  <AdminTD className="whitespace-nowrap text-neutral-400">{new Date(user.createdAt).toLocaleDateString()}</AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/users/${user.userId}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="users" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}
