import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Product, Storefront } from '@/lib/domain/entities'

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) return { title: 'Store Not Found' }
  return {
    title: `${DEMO_STOREFRONT.title} — SellBop`,
    description: DEMO_STOREFRONT.bio ?? undefined,
  }
}

export default async function StorefrontPage({ params }: { params: Promise<{ sellerSlug: string }> }) {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) notFound()

  const storefront = DEMO_STOREFRONT
  const orderMap = new Map(storefront.productOrder.map((id, i) => [id, i]))
  const published = DEMO_PRODUCTS
    .filter(p => p.status === 'published' && !storefront.hiddenProductIds.includes(p.id))
    .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

  const featured = storefront.featuredProductIds
    .map(id => published.find(p => p.id === id))
    .filter(Boolean) as Product[]
  const rest = published.filter(p => !storefront.featuredProductIds.includes(p.id))

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-neutral-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <SellBopLogo size="lg" />
        </div>
      </div>

      {/* Store header */}
      <StoreHeader storefront={storefront} />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Featured */}
        {featured.length > 0 && (
          <section className="pt-10">
            <SectionLabel>Featured</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {featured.map(p => <ProductCard key={p.id} product={p} accent={storefront.themeColor} featured />)}
            </div>
          </section>
        )}

        {/* All products */}
        {rest.length > 0 && (
          <section className="pt-10">
            <SectionLabel>All Products</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {rest.map(p => <ProductCard key={p.id} product={p} accent={storefront.themeColor} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {published.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-neutral-500 text-sm">No products here yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 text-center">
        <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
          Powered by <SellBopLogo size="sm" />
        </p>
      </footer>
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
      {children}
    </h2>
  )
}

// ── Store Header ──────────────────────────────────────────────
function StoreHeader({ storefront }: { storefront: Storefront }) {
  const socialLinks = [
    storefront.socialLinks.twitter && { href: storefront.socialLinks.twitter, icon: <TwitterIcon />, label: 'Twitter / X' },
    storefront.socialLinks.instagram && { href: storefront.socialLinks.instagram, icon: <InstagramIcon />, label: 'Instagram' },
    storefront.socialLinks.youtube && { href: storefront.socialLinks.youtube, icon: <YouTubeIcon />, label: 'YouTube' },
    storefront.socialLinks.website && { href: storefront.socialLinks.website, icon: <Globe size={15} />, label: 'Website' },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[]

  if (storefront.headerLayout === 'centered') {
    return (
      <div className="border-b border-neutral-100 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-4">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-md"
            style={{ backgroundColor: storefront.themeColor }}
          >
            {storefront.title.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{storefront.title}</h1>
            {storefront.headline && (
              <p className="text-neutral-500 text-sm sm:text-base mt-1 font-medium">{storefront.headline}</p>
            )}
            {storefront.bio && (
              <p className="text-neutral-600 text-sm mt-3 max-w-md mx-auto leading-relaxed">{storefront.bio}</p>
            )}
          </div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {socialLinks.map(l => <SocialButton key={l.href} {...l} />)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (storefront.headerLayout === 'banner_avatar') {
    return (
      <div className="border-b border-neutral-100">
        <div
          className="h-24 sm:h-32 w-full"
          style={{ background: `linear-gradient(135deg, ${storefront.themeColor}22 0%, ${storefront.themeColor}11 100%)` }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg border-4 border-white -mt-9 sm:-mt-10"
            style={{ backgroundColor: storefront.themeColor, width: 72, height: 72 }}
          >
            {storefront.title.charAt(0)}
          </div>
          <div className="mt-4">
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{storefront.title}</h1>
            {storefront.headline && (
              <p className="text-neutral-500 text-sm mt-0.5 font-medium">{storefront.headline}</p>
            )}
            {storefront.bio && (
              <p className="text-neutral-600 text-sm mt-2 max-w-lg leading-relaxed">{storefront.bio}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {socialLinks.map(l => <SocialButton key={l.href} {...l} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default: left_avatar
  return (
    <div className="border-b border-neutral-100 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-start gap-5 sm:gap-7">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-black flex-shrink-0 shadow-md"
            style={{ backgroundColor: storefront.themeColor }}
          >
            {storefront.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">{storefront.title}</h1>
            {storefront.headline && (
              <p className="text-neutral-500 text-sm mt-0.5 font-medium">{storefront.headline}</p>
            )}
            {storefront.bio && (
              <p className="text-neutral-600 text-sm mt-2 max-w-lg leading-relaxed">{storefront.bio}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {socialLinks.map(l => <SocialButton key={l.href} {...l} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Social Button ─────────────────────────────────────────────
function SocialButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-neutral-400 hover:bg-neutral-50 transition-all"
    >
      {icon}
    </a>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, accent, featured }: { product: Product; accent: string; featured?: boolean }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <div className={cn(
        'bg-white rounded-2xl border overflow-hidden transition-all duration-200 h-full flex flex-col',
        featured
          ? 'border-neutral-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
          : 'border-neutral-150 hover:border-neutral-300 hover:shadow-md',
      )}>
        {/* Image */}
        <div className="aspect-video relative overflow-hidden bg-neutral-50">
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* Type badge */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              {TYPE_LABELS[product.productType]}
            </span>
            {featured && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: accent + '18', color: accent }}
              >
                Featured
              </span>
            )}
          </div>

          {/* Name */}
          <p className="font-bold text-black text-sm sm:text-base leading-tight group-hover:underline underline-offset-2 decoration-neutral-300">
            {product.name}
          </p>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed line-clamp-2 flex-1">
              {product.shortDescription}
            </p>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-baseline gap-2">
              <span className="font-black text-black text-base">{formatCurrency(product.price, product.currency)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
              )}
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition-opacity group-hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              {product.ctaText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
