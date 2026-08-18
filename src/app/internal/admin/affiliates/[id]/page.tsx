import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminAffiliateById } from '@/lib/admin/affiliates'
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

export default async function AdminAffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const affiliate = await getAdminAffiliateById(id)
  if (!affiliate) notFound()

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/internal/admin?section=affiliates" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to Affiliates
      </Link>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Affiliate</p>
        <h1 className="text-2xl font-bold text-black">{affiliate.affiliateName ?? affiliate.affiliateEmail ?? 'Affiliate'}</h1>
        <p className="text-sm text-neutral-500">{affiliate.productTitle}</p>
      </div>

      <Section title="Relationship">
        <Row label="Referral code" value={<span className="font-mono">{affiliate.referralCode}</span>} />
        <Row label="Status" value={affiliate.status} />
        <Row label="Commission" value={`${affiliate.commissionPercent ?? 0}%`} />
        <Row label="Created" value={formatDate(affiliate.createdAt, 'long')} />
      </Section>

      <Section title="Performance">
        <Row label="Clicks" value={affiliate.clickCount} />
        <Row label="Orders" value={affiliate.orderCount} />
        <Row label="Earned" value={formatCurrency(affiliate.commissionEarnedCents)} />
      </Section>

      <Section title="Links">
        <Row label="Affiliate user" value={
          <Link href={`/internal/admin/users/${affiliate.affiliateUserId}`} className="underline">View user</Link>
        } />
        <Row label="Product" value={
          <Link href={`/internal/admin/products/${affiliate.productId}`} className="underline">{affiliate.productTitle}</Link>
        } />
        <Row label="Seller" value={
          <Link href={`/internal/admin/users/${affiliate.sellerUserId}`} className="underline">{affiliate.sellerName ?? 'View seller'}</Link>
        } />
      </Section>
    </div>
  )
}
