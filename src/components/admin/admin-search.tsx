import Link from 'next/link'
import type { adminGlobalSearch } from '@/lib/admin/users'
import { formatCurrency } from '@/lib/utils'

export function AdminGlobalSearch({
  query,
  results,
}: {
  query: string
  results: Awaited<ReturnType<typeof adminGlobalSearch>>
}) {
  const hasResults = results.users.length + results.products.length + results.orders.length + results.buyers.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">Search</h1>
        <p className="text-sm text-neutral-500">Results for &ldquo;{query}&rdquo;</p>
      </div>

      {!hasResults && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">
          No matching users, products, orders, or buyers.
        </div>
      )}

      {results.users.length > 0 && (
        <Section title="Users">
          {results.users.map((user) => (
            <Link key={user.userId} href={`/internal/admin/users/${user.userId}`} className="block border-b border-neutral-100 py-3 last:border-0 hover:text-black">
              <p className="font-medium">{user.fullName ?? user.email}</p>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </Link>
          ))}
        </Section>
      )}

      {results.products.length > 0 && (
        <Section title="Products">
          {results.products.map((product) => (
            <Link key={product.id} href={`/internal/admin/products/${product.id}`} className="block border-b border-neutral-100 py-3 last:border-0">
              <p className="font-medium">{product.title}</p>
              <p className="text-xs text-neutral-400">{product.storeName} · {formatCurrency(product.priceCents)}</p>
            </Link>
          ))}
        </Section>
      )}

      {results.orders.length > 0 && (
        <Section title="Orders">
          {results.orders.map((order) => (
            <Link key={order.id} href={`/internal/admin/orders/${order.id}`} className="block border-b border-neutral-100 py-3 last:border-0">
              <p className="font-medium">{order.productName}</p>
              <p className="text-xs text-neutral-400">{order.buyerEmail} · {formatCurrency(order.totalCents)}</p>
            </Link>
          ))}
        </Section>
      )}

      {results.buyers.length > 0 && (
        <Section title="Buyers">
          {results.buyers.map((buyer) => (
            <Link key={buyer.email} href={`/internal/admin/buyers/${buyer.key}`} className="block border-b border-neutral-100 py-3 last:border-0">
              <p className="font-medium">{buyer.name ?? buyer.email}</p>
              <p className="text-xs text-neutral-400">{buyer.email}</p>
            </Link>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-3">
        <p className="text-sm font-bold text-black">{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}
