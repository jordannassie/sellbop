import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { AdminUserSummary } from '@/lib/admin/users'
import { formatCurrency } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function Avatar({ name }: { name: string }) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={8} className="py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">No {label} yet</p>
      </td>
    </tr>
  )
}

function TH({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">{children}</th>
}

function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
}

function nameFor(user: AdminUserSummary) {
  return user.fullName ?? user.email.split('@')[0]
}

function UserLink({ user }: { user: AdminUserSummary }) {
  const displayName = nameFor(user)
  return (
    <Link href={`/internal/admin/users/${user.userId}`} className="flex items-center gap-3">
      <Avatar name={displayName} />
      <div>
        <p className="whitespace-nowrap font-medium text-black">{displayName}</p>
        <p className="font-mono text-[11px] text-neutral-400">{user.userId}</p>
      </div>
    </Link>
  )
}

export function UsersSection({ users }: { users: AdminUserSummary[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Users</h1>
        <span className="text-sm text-neutral-400">{users.length} total</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <TH>User</TH>
                <TH>Email</TH>
                <TH>Buyer</TH>
                <TH>Seller</TH>
                <TH>Store</TH>
                <TH>Joined</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.length === 0 && <EmptyState label="users" />}
              {users.map((user) => (
                <tr key={user.userId} className="transition-colors hover:bg-neutral-50">
                  <TD><UserLink user={user} /></TD>
                  <TD className="whitespace-nowrap text-neutral-500">{user.email}</TD>
                  <TD>{user.isBuyer ? 'Yes' : 'No'}</TD>
                  <TD>{user.isSeller ? 'Yes' : 'No'}</TD>
                  <TD className="text-neutral-500">{user.storeSlug ? `/${user.storeSlug}` : '—'}</TD>
                  <TD className="whitespace-nowrap text-neutral-400">{new Date(user.createdAt).toLocaleDateString()}</TD>
                  <TD className="text-right">
                    <Link href={`/internal/admin/users/${user.userId}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function SellersSection({ users }: { users: AdminUserSummary[] }) {
  const sellers = users.filter((user) => user.isSeller)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Sellers</h1>
        <span className="text-sm text-neutral-400">{sellers.length} total</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <TH>Seller</TH>
                <TH>Email</TH>
                <TH>Store</TH>
                <TH>Buy Activity</TH>
                <TH>Total Spent</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {sellers.length === 0 && <EmptyState label="sellers" />}
              {sellers.map((seller) => (
                <tr key={seller.userId} className="transition-colors hover:bg-neutral-50">
                  <TD><UserLink user={seller} /></TD>
                  <TD className="whitespace-nowrap text-neutral-500">{seller.email}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{seller.storeName ?? 'Store'}</span>
                      {seller.storeSlug && (
                        <Link
                          href={`/store/${seller.storeSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black"
                        >
                          <ExternalLink size={11} /> /{seller.storeSlug}
                        </Link>
                      )}
                    </div>
                  </TD>
                  <TD className="text-neutral-600">
                    {seller.isBuyer ? `${seller.orderCount} orders · ${seller.subscriptionCount} subs` : 'No buyer activity'}
                  </TD>
                  <TD className="font-semibold text-black">{formatCurrency(seller.totalSpentCents)}</TD>
                  <TD className="text-right">
                    <Link href={`/internal/admin/users/${seller.userId}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function BuyersSection({ users }: { users: AdminUserSummary[] }) {
  const buyers = users.filter((user) => user.isBuyer)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Buyers</h1>
        <span className="text-sm text-neutral-400">{buyers.length} total</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <TH>Buyer</TH>
                <TH>Email</TH>
                <TH>Purchases</TH>
                <TH>Orders</TH>
                <TH>Subscriptions</TH>
                <TH>Total Spent</TH>
                <TH>Seller Too?</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {buyers.length === 0 && <EmptyState label="buyers" />}
              {buyers.map((buyer) => (
                <tr key={buyer.userId} className="transition-colors hover:bg-neutral-50">
                  <TD><UserLink user={buyer} /></TD>
                  <TD className="whitespace-nowrap text-neutral-500">{buyer.email}</TD>
                  <TD>{buyer.purchaseCount}</TD>
                  <TD>{buyer.orderCount}</TD>
                  <TD>{buyer.subscriptionCount}</TD>
                  <TD className="font-semibold text-black">{formatCurrency(buyer.totalSpentCents)}</TD>
                  <TD className="text-neutral-600">{buyer.isSeller ? 'Yes' : 'No'}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ProductsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Products</h1>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        Product-level admin is not yet migrated in this pass. The shared identity work is wired for users, buyers, sellers,
        orders, subscriptions, and user detail pages.
      </div>
    </div>
  )
}
