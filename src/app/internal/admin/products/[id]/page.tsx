import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminProductById } from '@/lib/admin/products'
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

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const product = await getAdminProductById(id)
  if (!product) notFound()

  const productUrl = product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/p/${product.slug}`

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/admin?section=products" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft size={15} /> Back to Products
      </Link>

      <div className="flex gap-4">
        {product.coverImageUrl && (
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-neutral-200">
            <Image src={product.coverImageUrl} alt="" fill className="object-cover" sizes="96px" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Admin · Product</p>
          <h1 className="text-2xl font-bold text-black">{product.title}</h1>
          <p className="text-sm text-neutral-500">{product.storeName} · {formatCurrency(product.priceCents)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={productUrl} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
          View Product <ExternalLink size={11} />
        </Link>
        {product.sellerUserId && (
          <Link href={`/internal/admin/users/${product.sellerUserId}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View Seller
          </Link>
        )}
        <Link href={`/internal/admin?section=orders&q=${product.id}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
          View Orders
        </Link>
      </div>

      <Section title="Product">
        <Row label="Status" value={product.isLive ? 'Active' : 'Draft'} />
        <Row label="Category" value={product.category ?? '—'} />
        <Row label="Type" value={product.productType} />
        <Row label="Price" value={formatCurrency(product.priceCents)} />
        <Row label="Sale price" value={product.saleEnabled && product.salePriceCents != null ? formatCurrency(product.salePriceCents) : '—'} />
        <Row label="Marketplace" value={product.marketplaceListing ? 'Enabled' : 'Disabled'} />
        <Row label="Affiliate" value={product.affiliateEnabled ? `${product.affiliateCommissionPercent ?? 0}%` : 'Disabled'} />
        <Row label="Files" value={product.fileCount} />
        <Row label="Media" value={product.mediaCount} />
        <Row label="Created" value={formatDate(product.createdAt, 'long')} />
        <Row label="Updated" value={formatDate(product.updatedAt, 'long')} />
      </Section>

      <Section title="Sales">
        <Row label="Orders" value={product.orderCount} />
        <Row label="Gross revenue" value={formatCurrency(product.revenueCents)} />
        <Row label="SellBop revenue" value={formatCurrency(product.platformRevenueCents)} />
        <Row label="Seller revenue" value={formatCurrency(Math.max(0, product.revenueCents - product.platformRevenueCents))} />
        <Row label="Refunds" value={product.refundCount} />
      </Section>

      {(product.shortDescription || product.description) && (
        <Section title="Description">
          {product.shortDescription && <p className="py-3 text-sm text-neutral-600">{product.shortDescription}</p>}
          {product.description && <p className="border-t border-neutral-100 py-3 text-sm text-neutral-700 whitespace-pre-wrap">{product.description}</p>}
        </Section>
      )}

      <Section title="Seller">
        <Row label="Name" value={product.sellerName ?? '—'} />
        <Row label="Email" value={product.sellerEmail ?? '—'} />
        <Row label="Store" value={product.storeSlug ? `/${product.storeSlug}` : product.storeName ?? '—'} />
      </Section>
    </div>
  )
}
