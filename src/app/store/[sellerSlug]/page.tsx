import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, ArrowRight, ArrowUpRight } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency, cn } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Product, Storefront } from '@/lib/domain/entities'

// ── Social Icons ──────────────────────────────────────────────
function TwitterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const TYPE_SHORT: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Monthly', bundle: 'Bundle', membership_ready: 'Member',
}

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) return { title: 'Store Not Found' }
  return {
    title: `${DEMO_STOREFRONT.title} — SellBop`,
    description: DEMO_STOREFRONT.bio ?? undefined,
    openGraph: {
      title: `${DEMO_STOREFRONT.title} — SellBop`,
      description: DEMO_STOREFRONT.bio ?? undefined,
    },
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
  const accent = storefront.themeColor

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky top nav ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 52 }}>
          <SellBopLogo size="lg" />
          <a
            href={`/store/${sellerSlug}#products`}
            className="text-xs font-semibold text-neutral-400 hover:text-black transition-colors hidden sm:flex items-center gap-1"
          >
            Browse Products <ArrowUpRight size={11} />
          </a>
        </div>
      </nav>

      {/* ── Store header ───────────────────────────────────────── */}
      <StoreHeader storefront={storefront} />

      {/* ── Main content ───────────────────────────────────────── */}
      <div id="products" className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">

        {/* Featured */}
        {featured.length > 0 && storefront.sectionVisibility['featured'] !== false && (
          <section aria-label="Featured products" className="pt-10 sm:pt-14">
            <SectionHeading label="Featured" accent={accent} count={featured.length} />
            {featured.length === 1 ? (
              <div className="mt-5">
                <HeroProductCard product={featured[0]} accent={accent} />
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {featured.map(p => <ProductCard key={p.id} product={p} accent={accent} featured />)}
              </div>
            )}
          </section>
        )}

        {/* All products */}
        {rest.length > 0 && storefront.sectionVisibility['all_products'] !== false && (
          <section aria-label="All products" className="pt-12 sm:pt-16">
            <SectionHeading label="All Products" accent={accent} count={rest.length} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {rest.map(p => <ProductCard key={p.id} product={p} accent={accent} />)}
            </div>
          </section>
        )}

        {/* Empty */}
        {published.length === 0 && (
          <div className="py-32 text-center">
            <div className="text-5xl mb-4">✦</div>
            <p className="text-neutral-400 text-sm font-medium">Products coming soon.</p>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            Powered by <SellBopLogo size="sm" />
          </p>
          <a
            href="/"
            className="text-xs font-semibold text-neutral-400 hover:text-black transition-colors flex items-center gap-1"
          >
            Sell your own products <ArrowRight size={11} />
          </a>
        </div>
      </footer>
    </div>
  )
}

// ── Section Heading ───────────────────────────────────────────
function SectionHeading({ label, accent, count }: { label: string; accent: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
      <h2 className="text-sm font-bold text-black tracking-tight">{label}</h2>
      <span className="text-xs text-neutral-300 font-semibold tabular-nums">{count}</span>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  )
}

// ── Store Header ──────────────────────────────────────────────
function StoreHeader({ storefront }: { storefront: Storefront }) {
  const socialLinks = [
    storefront.socialLinks.twitter    && { href: storefront.socialLinks.twitter,    icon: <TwitterIcon />,   label: 'X',        fullLabel: 'Twitter / X' },
    storefront.socialLinks.instagram  && { href: storefront.socialLinks.instagram,  icon: <InstagramIcon />, label: 'Instagram', fullLabel: 'Instagram' },
    storefront.socialLinks.youtube    && { href: storefront.socialLinks.youtube,    icon: <YouTubeIcon />,   label: 'YouTube',  fullLabel: 'YouTube' },
    storefront.socialLinks.website    && { href: storefront.socialLinks.website,    icon: <Globe size={14} />, label: 'Website', fullLabel: 'Website' },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; fullLabel: string }[]

  if (storefront.headerLayout === 'centered') {
    return (
      <header className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          {/* Avatar — rounded-square, consistent with dashboard identity style */}
          <div className="relative mb-7">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl"
              style={{ backgroundColor: storefront.themeColor, fontSize: 52 }}
            >
              {storefront.title.charAt(0)}
            </div>
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: `0 0 0 4px white, 0 0 0 7px ${storefront.themeColor}40` }}
            />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-none">
            {storefront.title}
          </h1>
          {storefront.headline && (
            <p className="text-neutral-500 text-base sm:text-lg mt-3 font-medium max-w-sm leading-snug">
              {storefront.headline}
            </p>
          )}
          {storefront.bio && (
            <p className="text-neutral-500 text-sm sm:text-base mt-4 max-w-lg leading-relaxed">
              {storefront.bio}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 mt-7 flex-wrap justify-center">
              {socialLinks.map((l, i) => (
                <SocialPill key={l.href} {...l} accent={storefront.themeColor} primary={i === 0} />
              ))}
            </div>
          )}
        </div>
      </header>
    )
  }

  if (storefront.headerLayout === 'banner_avatar') {
    return (
      <header>
        <div
          className="h-32 sm:h-44 w-full"
          style={{
            background: `linear-gradient(135deg, ${storefront.themeColor}30 0%, ${storefront.themeColor}12 60%, transparent 100%)`,
          }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-5 -mt-11 sm:-mt-14 mb-5">
            <div
              className="w-22 h-22 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl border-4 border-white flex-shrink-0"
              style={{ backgroundColor: storefront.themeColor, fontSize: 36, width: 88, height: 88 }}
            >
              {storefront.title.charAt(0)}
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight">
            {storefront.title}
          </h1>
          {storefront.headline && (
            <p className="text-neutral-500 text-sm sm:text-base mt-2 font-medium leading-snug">
              {storefront.headline}
            </p>
          )}
          {storefront.bio && (
            <p className="text-neutral-500 text-sm mt-3 max-w-xl leading-relaxed">
              {storefront.bio}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 mt-5 flex-wrap pb-8 border-b border-neutral-100">
              {socialLinks.map((l, i) => (
                <SocialPill key={l.href} {...l} accent={storefront.themeColor} primary={i === 0} />
              ))}
            </div>
          )}
          {socialLinks.length === 0 && <div className="pb-8 border-b border-neutral-100 mt-5" />}
        </div>
      </header>
    )
  }

  // Default: left_avatar
  return (
    <header className="border-b border-neutral-100 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-start gap-5 sm:gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-black shadow-xl"
              style={{ backgroundColor: storefront.themeColor, fontSize: 36 }}
            >
              {storefront.title.charAt(0)}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight">
              {storefront.title}
            </h1>
            {storefront.headline && (
              <p className="text-neutral-500 text-sm sm:text-base mt-2 font-semibold leading-snug">
                {storefront.headline}
              </p>
            )}
            {storefront.bio && (
              <p className="text-neutral-500 text-sm sm:text-[15px] mt-3 max-w-xl leading-relaxed">
                {storefront.bio}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                {socialLinks.map((l, i) => (
                  <SocialPill key={l.href} {...l} accent={storefront.themeColor} primary={i === 0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// ── Social Pill ───────────────────────────────────────────────
function SocialPill({ href, icon, label, fullLabel, accent, primary }: {
  href: string; icon: React.ReactNode; label: string; fullLabel: string; accent: string; primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={fullLabel}
      className={cn(
        'flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-bold transition-all',
        primary
          ? 'text-white hover:opacity-90'
          : 'border border-neutral-200 text-neutral-600 bg-white hover:border-neutral-400 hover:text-black hover:bg-neutral-50',
      )}
      style={primary ? { backgroundColor: accent } : undefined}
    >
      <span className={primary ? 'text-white/80' : 'text-neutral-400'}>{icon}</span>
      {label}
    </a>
  )
}

// ── Hero Card (single featured product) ───────────────────────
function HeroProductCard({ product, accent }: { product: Product; accent: string }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5">
        <div className="sm:flex">
          {/* Square image */}
          <div className="aspect-square sm:w-60 sm:aspect-auto sm:h-60 relative overflow-hidden bg-neutral-50 flex-shrink-0">
            <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="lg" />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ backgroundColor: accent + '18', color: accent }}
              >
                ✦ Featured
              </span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                {TYPE_SHORT[product.productType]}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-black leading-tight group-hover:opacity-80 transition-opacity">
              {product.name}
            </h3>

            {product.shortDescription && (
              <p className="text-neutral-500 text-sm mt-2 leading-relaxed flex-1 line-clamp-3">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-black">
                  {formatCurrency(product.price, product.currency)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-neutral-400 line-through font-medium">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <span
                className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all group-hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                {product.ctaText} <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, accent, featured }: { product: Product; accent: string; featured?: boolean }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block h-full">
      <div className={cn(
        'bg-white rounded-2xl border overflow-hidden transition-all duration-200 h-full flex flex-col',
        featured
          ? 'border-neutral-200 shadow-md hover:shadow-xl hover:-translate-y-1'
          : 'border-neutral-150 shadow-sm hover:shadow-lg hover:border-neutral-300 hover:-translate-y-0.5',
      )}>
        {/* Image — 4:3 ratio */}
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-50 flex-shrink-0">
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
          {/* Featured badge overlay */}
          {featured && (
            <div
              className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: accent }}
            >
              ✦ Featured
            </div>
          )}
          {/* Hover scrim */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/4 transition-all duration-200" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-1.5">
          {/* Type */}
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
            {TYPE_SHORT[product.productType]}
          </span>

          {/* Name */}
          <p className="font-bold text-black text-sm sm:text-[15px] leading-snug group-hover:opacity-70 transition-opacity">
            {product.name}
          </p>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 flex-1">
              {product.shortDescription}
            </p>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-neutral-100">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-black text-base leading-none">
                {formatCurrency(product.price, product.currency)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all group-hover:opacity-80 flex items-center gap-1"
              style={{ backgroundColor: accent }}
            >
              {product.ctaText} <ArrowRight size={9} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
