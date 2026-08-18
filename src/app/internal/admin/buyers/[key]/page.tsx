import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminBuyerDetail } from '@/lib/admin/buyers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RefundBadge } from '@/components/admin/admin-table'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-100 py-3 last:border-0">
      <span className="w-40 flex-shrink-0 text-sm text-neutral-400">{label}</span>
      <span className="text-right text-sm font-medium text-neutral-800">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <p className="text-sm font-bold text-black">{title}</p>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

export default async function AdminBuyerDetailPage({ params }: { params: Promise<{ key: string }> }) {
  await requireAdminUser()
  const { key } = await params
  const detail = await getAdminBuyerDetail(key)
  if (!detail) notFound()

  const { buyer, orders, purchases } = detail

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/admin?section=buyers" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to Buyers
      </Link>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Buyer</p>
        <h1 className="text-2xl font-bold text-black">{buyer.name ?? buyer.email}</h1>
        <p className="text-sm text-neutral-500">{buyer.email}</p>
      </div>

      <Section title="Buyer">
        <Row label="Account" value={buyer.isGuest ? 'Guest checkout' : 'Registered account'} />
        <Row label="User ID" value={buyer.buyerUserId ? (
          <Link href={`/internal/admin/users/${buyer.buyerUserId}`} className="underline">{buyer.buyerUserId}</Link>
        ) : '—'} />
        <Row label="Purchases" value={buyer.purchaseCount} />
        <Row label="Orders" value={buyer.orderCount} />
        <Row label="Total spent" value={formatCurrency(buyer.totalSpentCents)} />
        <Row label="Last purchase" value={buyer.lastPurchaseAt ? formatDate(buyer.lastPurchaseAt) : '—'} />
      </Section>

      <Section title="Purchases">
        {purchases.length === 0 ? (
          <p className="py-4 text-sm text-neutral-400">No purchases.</p>
        ) : purchases.map((purchase) => (
          <Row
            key={purchase.id}
            label={formatDate(purchase.createdAt)}
            value={`${purchase.status} · order ${purchase.orderId.slice(0, 8)}…`}
          />
        ))}
      </Section>

      <Section title="Orders">
        {orders.length === 0 ? (
          <p className="py-4 text-sm text-neutral-400">No orders.</p>
        ) : orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between border-b border-neutral-100 py-3 last:border-0">
            <div>
              <Link href={`/internal/admin/orders/${order.id}`} className="text-sm font-medium text-black hover:underline">
                {order.product_title_snapshot ?? 'Order'}
              </Link>
              <p className="text-xs text-neutral-400">{formatDate(order.created_at)} · {order.payment_status}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(order.total_cents)}</p>
              <RefundBadge status={order.refund_status ?? 'none'} />
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}
