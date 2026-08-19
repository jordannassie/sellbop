import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { PartnerStatusControl } from '@/components/admin/partner-status-control'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminUserDetail } from '@/lib/admin/users'
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
  const detail = await getAdminUserDetail(userId)
  if (!detail) notFound()

  const { user, products, purchases, ordersAsBuyer, ordersAsSeller, affiliateRelationships, affiliateCommissions } = detail

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/admin?section=users" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to Users
      </Link>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · User Detail</p>
        <p className="font-mono text-xs text-neutral-400">{user.userId}</p>
        <h1 className="text-2xl font-bold text-black">{user.fullName ?? user.email.split('@')[0]}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
      </div>

      <PartnerStatusControl userId={user.userId} initialIsPartner={user.isPartner} />

      <Section title="Profile">
        <Row label="Full name" value={user.fullName ?? '—'} />
        <Row label="Email" value={user.email} />
        <Row label="Joined" value={formatDate(user.createdAt)} />
        <Row label="Is seller" value={user.isSeller ? 'Yes' : 'No'} />
        <Row label="SellBop Partner" value={user.isPartner ? 'Yes' : 'No'} />
        <Row label="Is buyer" value={user.isBuyer ? 'Yes' : 'No'} />
        <Row label="Total spent" value={formatCurrency(user.totalSpentCents)} />
        <Row label="Total sales" value={formatCurrency(user.totalSalesCents)} />
      </Section>

      {user.isSeller && (
        <Section title="Store">
          <Row label="Store name" value={user.storeName ?? '—'} />
          <Row
            label="Store URL"
            value={user.storeSlug ? (
              <Link href={`/${user.storeSlug}`} target="_blank" className="inline-flex items-center gap-1 underline">
                /{user.storeSlug} <ExternalLink size={11} />
              </Link>
            ) : '—'}
          />
          <Row label="Products" value={products.length} />
        </Section>
      )}

      {products.length > 0 && (
        <Section title="Products">
          {products.map((product) => (
            <Row
              key={product.id}
              label={product.title}
              value={
                <Link href={`/internal/admin/products/${product.id}`} className="underline">
                  {product.is_live ? 'Active' : 'Draft'} · {formatCurrency(product.price_cents ?? 0)}
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {purchases.length > 0 && (
        <Section title="Purchases">
          {purchases.map((purchase) => (
            <Row key={purchase.id} label={formatDate(purchase.created_at)} value={`${purchase.status} · ${purchase.id.slice(0, 8)}…`} />
          ))}
        </Section>
      )}

      {ordersAsBuyer.length > 0 && (
        <Section title="Orders as buyer">
          {ordersAsBuyer.map((order) => (
            <Row
              key={order.id}
              label={order.product_title_snapshot ?? 'Order'}
              value={
                <Link href={`/internal/admin/orders/${order.id}`} className="underline">
                  {formatCurrency(order.total_cents)} · {order.payment_status}
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {ordersAsSeller.length > 0 && (
        <Section title="Orders as seller">
          {ordersAsSeller.map((order) => (
            <Row
              key={order.id}
              label={order.product_title_snapshot ?? 'Order'}
              value={
                <Link href={`/internal/admin/orders/${order.id}`} className="underline">
                  {formatCurrency(order.total_cents)} · {order.buyer_email}
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {affiliateRelationships.length > 0 && (
        <Section title="Affiliate relationships">
          {affiliateRelationships.map((rel) => (
            <Row
              key={rel.id}
              label={rel.referral_code}
              value={
                <Link href={`/internal/admin/affiliates/${rel.id}`} className="underline capitalize">
                  {rel.status}
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {affiliateCommissions.length > 0 && (
        <Section title="Affiliate commissions">
          {affiliateCommissions.map((c) => (
            <Row key={c.id} label={formatDate(c.created_at)} value={`${formatCurrency(c.commission_cents)} · ${c.status}`} />
          ))}
        </Section>
      )}
    </div>
  )
}
