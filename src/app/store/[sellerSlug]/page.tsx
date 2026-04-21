import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Globe } from 'lucide-react'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

function TwitterIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) return { title: 'Store Not Found' }
  return {
    title: `${DEMO_STOREFRONT.title} — SellBop Store`,
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
          <SellBopLogo size="lg" />
        </div>
      </div>

      {/* Store header */}
      <div className="border-b border-neutral-100 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-black flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0 shadow-md">
              {storefront.title.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">{storefront.title}</h1>
              {storefront.bio && <p className="text-neutral-600 text-sm mt-1.5 max-w-lg leading-relaxed">{storefront.bio}</p>}
              <div className="flex items-center gap-2 mt-3">
                {storefront.socialLinks.twitter && (
                  <a
                    href={storefront.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter / X"
                    className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-neutral-400 transition-colors"
                  >
                    <TwitterIcon />
                  </a>
                )}
                {storefront.socialLinks.instagram && (
                  <a
                    href={storefront.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-neutral-400 transition-colors"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {storefront.socialLinks.website && (
                  <a
                    href={storefront.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                    className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-neutral-400 transition-colors"
                  >
                    <Globe size={15} />
                  </a>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-5">All Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {rest.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-neutral-100 py-6 text-center">
        <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">Powered by <SellBopLogo size="sm" /></p>
      </footer>
    </div>
  )
}

function ProductCard({ product }: { product: (typeof DEMO_PRODUCTS)[0] }) {
  return (
    <Link href={`/p/${product.slug}`}>
      <div className="border border-neutral-200 rounded-xl hover:shadow-md transition-shadow bg-white group overflow-hidden">
        <div className="aspect-video relative overflow-hidden">
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
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
