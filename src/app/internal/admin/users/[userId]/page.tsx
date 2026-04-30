import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminUserById } from '@/lib/admin/users'
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

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdminUser()
  const { userId } = await params
  const user = await getAdminUserById(userId)

  if (!user) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/internal/admin?section=users" className="mb-6 flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-black">
        <ArrowLeft size={15} /> Back to Users
      </Link>

      <div className="mb-6">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · User Detail</p>
        <p className="mb-1 text-xs font-mono text-neutral-400">{user.userId}</p>
        <h1 className="text-2xl font-bold text-black">{user.fullName ?? user.email.split('@')[0]}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
      </div>

      <div className="space-y-4">
        <Section title="Profile">
          <Row label="Full name" value={user.fullName ?? '—'} />
          <Row label="Email" value={user.email} />
          <Row label="Joined" value={formatDate(user.createdAt)} />
        </Section>

        <Section title="Roles">
          <Row label="Is buyer" value={user.isBuyer ? 'Yes' : 'No'} />
          <Row label="Is seller" value={user.isSeller ? 'Yes' : 'No'} />
          <Row label="Purchase count" value={user.purchaseCount} />
          <Row label="Order count" value={user.orderCount} />
          <Row label="Subscription count" value={user.subscriptionCount} />
          <Row label="Total spent" value={formatCurrency(user.totalSpentCents)} />
          <Row label="Last purchase" value={user.lastPurchaseAt ? formatDate(user.lastPurchaseAt) : '—'} />
        </Section>

        <Section title="Store">
          <Row label="Owns store" value={user.isSeller ? 'Yes' : 'No'} />
          <Row label="Store name" value={user.storeName ?? '—'} />
          <Row
            label="Store slug"
            value={user.storeSlug ? (
              <Link href={`/store/${user.storeSlug}`} target="_blank" className="inline-flex items-center gap-1 underline underline-offset-2">
                /{user.storeSlug} <ExternalLink size={11} />
              </Link>
            ) : '—'}
          />
        </Section>
      </div>
    </div>
  )
}
