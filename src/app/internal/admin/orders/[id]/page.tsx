import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminOrderById } from '@/lib/admin/users'
import { formatCurrency, formatDate } from '@/lib/utils'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-100 py-3 last:border-0">
      <span className="w-36 flex-shrink-0 text-sm text-neutral-400">{label}</span>
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

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const order = await getAdminOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/internal/admin?section=orders" className="mb-6 flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-black">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="mb-6">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Order Detail</p>
        <p className="mb-1 text-xs font-mono text-neutral-400">{order.id}</p>
        <h1 className="text-2xl font-bold text-black">{order.productName}</h1>
        <p className="mt-1 text-sm text-neutral-500">{formatDate(order.createdAt, 'long')}</p>
      </div>

      <div className="space-y-4">
        <Section title="Order Details">
          <Row label="Product" value={order.productName} />
          <Row label="Amount" value={<span className="font-bold text-black">{formatCurrency(order.totalCents)}</span>} />
          <Row label="Order status" value={order.status} />
          <Row label="Payment" value={order.paymentStatus} />
          <Row label="Store" value={order.storeSlug ? `/store/${order.storeSlug}` : order.storeId} />
          <Row label="Date" value={formatDate(order.createdAt, 'long')} />
        </Section>

        <Section title="Buyer">
          <Row label="Name" value={order.buyerName ?? 'Guest checkout'} />
          <Row label="Email" value={order.buyerEmail ?? 'No email recorded'} />
          <Row label="Buyer user id" value={order.buyerUserId ?? 'Guest / unlinked'} />
          <Row label="Seller user id" value={order.sellerUserId ?? 'Not yet linked'} />
        </Section>
      </div>
    </div>
  )
}
