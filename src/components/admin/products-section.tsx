import Link from 'next/link'
import Image from 'next/image'
import type { AdminProductSummary } from '@/lib/admin/products'
import { formatCurrency } from '@/lib/utils'
import { AdminEmptyState, AdminFilterBar, AdminPagination, AdminTD, AdminTH } from '@/components/admin/admin-table'

export function ProductsSection({
  products,
  page,
  totalPages,
  total,
  q,
  filter,
}: {
  products: AdminProductSummary[]
  page: number
  totalPages: number
  total: number
  q?: string
  filter?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">Products</h1>
          <p className="text-sm text-neutral-400">{total} total</p>
        </div>
        <AdminFilterBar
          section="products"
          q={q}
          filter={filter}
          filters={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'marketplace', label: 'Marketplace' },
            { value: 'affiliate', label: 'Affiliate enabled' },
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Product</AdminTH>
                <AdminTH>Seller</AdminTH>
                <AdminTH>Price</AdminTH>
                <AdminTH>Category</AdminTH>
                <AdminTH>Status</AdminTH>
                <AdminTH>Marketplace</AdminTH>
                <AdminTH>Affiliate</AdminTH>
                <AdminTH>Sales</AdminTH>
                <AdminTH>Revenue</AdminTH>
                <AdminTH>Created</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.length === 0 && <AdminEmptyState label="products" colSpan={11} />}
              {products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-neutral-50">
                  <AdminTD>
                    <Link href={`/internal/admin/products/${product.id}`} className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {product.coverImageUrl ? (
                          <Image src={product.coverImageUrl} alt="" fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">—</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-black">{product.title}</p>
                        <p className="font-mono text-[11px] text-neutral-400">{product.slug}</p>
                      </div>
                    </Link>
                  </AdminTD>
                  <AdminTD className="text-neutral-600">{product.storeName ?? '—'}</AdminTD>
                  <AdminTD>
                    <div>
                      <p className="font-semibold text-black">{formatCurrency(product.priceCents)}</p>
                      {product.saleEnabled && product.salePriceCents != null && (
                        <p className="text-[11px] text-emerald-600">Sale {formatCurrency(product.salePriceCents)}</p>
                      )}
                    </div>
                  </AdminTD>
                  <AdminTD className="text-neutral-500">{product.category ?? '—'}</AdminTD>
                  <AdminTD>{product.isLive ? 'Active' : 'Draft'}</AdminTD>
                  <AdminTD>{product.marketplaceListing ? 'Yes' : 'No'}</AdminTD>
                  <AdminTD>
                    {product.affiliateEnabled
                      ? `${product.affiliateCommissionPercent ?? 0}%`
                      : '—'}
                  </AdminTD>
                  <AdminTD>{product.orderCount}</AdminTD>
                  <AdminTD className="font-semibold text-black">{formatCurrency(product.revenueCents)}</AdminTD>
                  <AdminTD className="text-neutral-400">{new Date(product.createdAt).toLocaleDateString()}</AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/products/${product.id}`} className="text-xs font-medium text-neutral-400 hover:text-black">
                      View →
                    </Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="products" page={page} totalPages={totalPages} total={total} q={q} filter={filter} />
      </div>
    </div>
  )
}

export function MarketplaceSection({
  products,
  page,
  totalPages,
  total,
  q,
}: {
  products: AdminProductSummary[]
  page: number
  totalPages: number
  total: number
  q?: string
}) {
  const marketplaceGross = products.reduce((s, p) => s + p.revenueCents, 0)
  const marketplacePlatform = products.reduce((s, p) => s + p.platformRevenueCents, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">Marketplace</h1>
          <p className="text-sm text-neutral-500">Marketplace-listed products and attributed sales revenue.</p>
        </div>
        <AdminFilterBar section="marketplace" q={q} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Listed products', total],
          ['Gross (filtered)', formatCurrency(marketplaceGross)],
          ['Platform revenue (filtered)', formatCurrency(marketplacePlatform)],
          ['Sellers (page)', new Set(products.map((p) => p.storeId)).size],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label as string}</p>
            <p className="mt-1 text-xl font-bold text-black">{value as string | number}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <AdminTH>Product</AdminTH>
                <AdminTH>Seller</AdminTH>
                <AdminTH>Price</AdminTH>
                <AdminTH>Sales</AdminTH>
                <AdminTH>Revenue</AdminTH>
                <AdminTH />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.length === 0 && <AdminEmptyState label="marketplace products" colSpan={6} />}
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50">
                  <AdminTD>
                    <Link href={`/internal/admin/products/${product.id}`} className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-neutral-100">
                        {product.coverImageUrl && <Image src={product.coverImageUrl} alt="" fill className="object-cover" sizes="40px" />}
                      </div>
                      <span className="font-medium">{product.title}</span>
                    </Link>
                  </AdminTD>
                  <AdminTD>{product.storeName}</AdminTD>
                  <AdminTD>{formatCurrency(product.priceCents)}</AdminTD>
                  <AdminTD>{product.orderCount}</AdminTD>
                  <AdminTD>{formatCurrency(product.revenueCents)}</AdminTD>
                  <AdminTD className="text-right">
                    <Link href={`/internal/admin/products/${product.id}`} className="text-xs text-neutral-400 hover:text-black">View →</Link>
                  </AdminTD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination section="marketplace" page={page} totalPages={totalPages} total={total} q={q} />
      </div>
    </div>
  )
}
