import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminOrderById } from '@/lib/admin/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RefundBadge, SaleSourceBadge } from '@/components/admin/admin-table'

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

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const order = await getAdminOrderById(id)
  if (!order) notFound()

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/internal/admin?section=orders" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Order Detail</p>
        <p className="font-mono text-xs text-neutral-400">{order.id}</p>
        <h1 className="text-2xl font-bold text-black">{order.productName}</h1>
        <p className="mt-1 text-sm text-neutral-500">{formatDate(order.createdAt, 'long')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.productId && (
          <Link href={`/internal/admin/products/${order.productId}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View Product
          </Link>
        )}
        {order.sellerUserId && (
          <Link href={`/internal/admin/users/${order.sellerUserId}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View Seller
          </Link>
        )}
        {order.buyerEmail && (
          <Link href={`/internal/admin/buyers/${encodeURIComponent(order.buyerEmail)}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View Buyer
          </Link>
        )}
        {order.storeSlug && (
          <Link href={`/${order.storeSlug}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View Store <ExternalLink size={11} />
          </Link>
        )}
      </div>

      <Section title="Economics">
        <Row label="Gross" value={<span className="font-bold">{formatCurrency(order.totalCents)}</span>} />
        <Row label="Subtotal" value={formatCurrency(order.subtotalCents)} />
        <Row label="Discount" value={order.discountCents > 0 ? formatCurrency(order.discountCents) : '—'} />
        <Row label="SellBop fee" value={formatCurrency(order.platformFeeCents)} />
        <Row label="Affiliate commission" value={order.affiliateCommissionCents > 0 ? formatCurrency(order.affiliateCommissionCents) : '—'} />
        <Row label="Seller net" value={formatCurrency(order.sellerNetCents)} />
        <Row label="Sale source" value={<SaleSourceBadge source={order.saleSource} hasAffiliate={order.hasAffiliate} />} />
      </Section>

      <Section title="Payment & refund">
        <Row label="Order status" value={order.status} />
        <Row label="Payment" value={order.paymentStatus} />
        <Row label="Refund status" value={<RefundBadge status={order.refundStatus} />} />
        <Row label="Refunded amount" value={order.refundedCents > 0 ? formatCurrency(order.refundedCents) : '—'} />
        <Row label="Stripe session" value={order.stripeSessionId ? `${order.stripeSessionId.slice(0, 20)}…` : '—'} />
        <Row label="Payment intent" value={order.stripePaymentIntentId ? `${order.stripePaymentIntentId.slice(0, 20)}…` : '—'} />
      </Section>

      <Section title="Buyer">
        <Row label="Name" value={order.buyerName ?? 'Guest checkout'} />
        <Row label="Email" value={order.buyerEmail ?? '—'} />
        <Row label="User ID" value={order.buyerUserId ?? 'Guest / unlinked'} />
      </Section>

      <Section title="Fulfillment">
        <Row label="Purchase ID" value={order.purchaseId ?? '—'} />
        <Row label="Purchase status" value={order.purchaseStatus ?? '—'} />
        <Row label="Email deliveries" value={order.emailDeliveryCount} />
        <Row label="Seller" value={order.storeName ?? order.storeSlug ?? '—'} />
      </Section>
    </div>
  )
}
