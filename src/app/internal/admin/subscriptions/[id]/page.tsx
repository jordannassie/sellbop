import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminSubscriptionById } from '@/lib/admin/users'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export default async function AdminSubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const subscription = await getAdminSubscriptionById(id)

  if (!subscription) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/internal/admin?section=subscriptions" className="mb-6 flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-black">
        <ArrowLeft size={15} /> Back to Subscriptions
      </Link>

      <div className="mb-6">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Subscription Detail</p>
        <p className="mb-1 text-xs font-mono text-neutral-400">{subscription.id}</p>
        <h1 className="text-2xl font-bold text-black">{subscription.productName}</h1>
        <p className="mt-1 text-sm text-neutral-500">{subscription.customerEmail}</p>
      </div>

      <div className="space-y-4">
        <Section title="Subscription Details">
          <Row label="Product" value={subscription.productName} />
          <Row
            label="Amount"
            value={subscription.amountCents != null
              ? `${formatCurrency(subscription.amountCents, subscription.currency ?? 'usd')} / period`
              : '—'}
          />
          <Row label="Status" value={subscription.status} />
          <Row label="Next billing" value={subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '—'} />
          <Row label="Started" value={formatDate(subscription.createdAt)} />
        </Section>

        <Section title="Identity">
          <Row label="Customer email" value={subscription.customerEmail} />
          <Row label="User id" value={subscription.userId ?? 'Guest / unlinked'} />
          <Row label="Product id" value={subscription.productId} />
        </Section>
      </div>
    </div>
  )
}
