import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) return { title: 'Store Not Found' }
  return {
    title: `${DEMO_STOREFRONT.title} — Selli Store`,
    description: DEMO_STOREFRONT.bio ?? undefined,
  }
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

export default async function StorefrontPage({ params }: { params: Promise<{ sellerSlug: string }> }) {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) notFound()

  const storefront = DEMO_STOREFRONT
  const products = DEMO_PRODUCTS.filter(p => p.status === 'published')
  const featured = products.filter(p => storefront.featuredProductIds.includes(p.id))
  const rest = products.filter(p => !storefront.featuredProductIds.includes(p.id))

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center">
          <Link href="/" className="text-sm font-bold text-black">Selli</Link>
        </div>
      </div>

      {/* Store header */}
      <div className="border-b border-neutral-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {storefront.title.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">{storefront.title}</h1>
              {storefront.bio && <p className="text-neutral-600 text-sm mt-1.5 max-w-lg leading-relaxed">{storefront.bio}</p>}
              <div className="flex items-center gap-4 mt-3">
                {storefront.socialLinks.twitter && (
                  <a href={storefront.socialLinks.twitter} target="_blank" rel="noopener" className="text-xs text-neutral-400 hover:text-black">Twitter →</a>
                )}
                {storefront.socialLinks.instagram && (
                  <a href={storefront.socialLinks.instagram} target="_blank" rel="noopener" className="text-xs text-neutral-400 hover:text-black">Instagram →</a>
                )}
                {storefront.socialLinks.website && (
                  <a href={storefront.socialLinks.website} target="_blank" rel="noopener" className="text-xs text-neutral-400 hover:text-black">Website →</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-5">Featured</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-5">All Products</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {rest.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-neutral-100 py-6 text-center">
        <p className="text-xs text-neutral-400">Powered by <Link href="/" className="text-black font-medium">Selli</Link></p>
      </footer>
    </div>
  )
}

function ProductCard({ product }: { product: (typeof DEMO_PRODUCTS)[0] }) {
  return (
    <Link href={`/p/${product.slug}`}>
      <div className="border border-neutral-200 rounded-xl hover:shadow-md transition-shadow bg-white group overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
          <span className="text-4xl opacity-25">
            {product.productType === 'digital_download' ? '📄' : product.productType === 'service_offer' ? '🎯' : product.productType === 'subscription' ? '♻️' : '📦'}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs text-neutral-400">{TYPE_LABELS[product.productType]}</span>
          </div>
          <p className="font-semibold text-black text-sm mb-1 group-hover:underline underline-offset-2">{product.name}</p>
          {product.shortDescription && (
            <p className="text-xs text-neutral-500 mb-3 leading-relaxed line-clamp-2">{product.shortDescription}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="font-bold text-black">{formatCurrency(product.price, product.currency)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
