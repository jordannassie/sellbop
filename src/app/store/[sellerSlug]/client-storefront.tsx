'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, ArrowRight, ArrowUpRight, Shirt, Zap } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT, DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { demoStorefrontRepo, demoProductRepo } from '@/lib/adapters/demo/repositories'
import { formatCurrency, cn } from '@/lib/utils'
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

// ── Main Client Component ─────────────────────────────────────
export function ClientStorefront({ sellerSlug }: { sellerSlug: string }) {
  const [storefront, setStorefront] = useState<Storefront>(DEMO_STOREFRONT)
  const [allProducts, setAllProducts] = useState<Product[]>(DEMO_PRODUCTS)
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage on mount — picks up any saves from the Store Editor + Printify syncs
  useEffect(() => {
    Promise.all([
      demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id),
      demoProductRepo.findAll(DEMO_SELLER_PROFILE.id),
    ]).then(([s, products]) => {
      if (s) setStorefront(s as Storefront)
      if (products.length > 0) setAllProducts(products)
      setReady(true)
    })
  }, [])

  const orderMap = new Map(storefront.productOrder.map((id, i) => [id, i]))
  const digitalProducts = allProducts
    .filter(p => !p.source && p.status === 'published' && !storefront.hiddenProductIds.includes(p.id))
    .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
  const clothingProducts = allProducts.filter(p => p.source === 'printify' && p.status === 'published')

  const featured = storefront.featuredProductIds
    .map(id => digitalProducts.find(p => p.id === id))
    .filter(Boolean) as Product[]
  const rest = digitalProducts.filter(p => !storefront.featuredProductIds.includes(p.id))
  const accent = storefront.themeColor

  // Skeleton while we read localStorage (avoids flash of stale seed data)
  if (!ready) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 52 }}>
            <SellBopLogo size="lg" />
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 flex flex-col gap-4 animate-pulse">
          <div className="flex items-start gap-8">
            <div className="w-36 h-36 rounded-2xl bg-neutral-100 flex-shrink-0" />
            <div className="flex-1 pt-2 space-y-3">
              <div className="w-48 h-6 bg-neutral-200 rounded-full" />
              <div className="w-64 h-4 bg-neutral-100 rounded-full" />
              <div className="w-full h-3 bg-neutral-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

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

        {/* All digital products */}
        {rest.length > 0 && storefront.sectionVisibility['all_products'] !== false && (
          <section aria-label="All products" className="pt-12 sm:pt-16">
            <SectionHeading label="All Products" accent={accent} count={rest.length} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {rest.map(p => <ProductCard key={p.id} product={p} accent={accent} />)}
            </div>
          </section>
        )}

        {/* Clothing — Printify products */}
        {clothingProducts.length > 0 && (
          <section aria-label="Clothing" className="pt-12 sm:pt-16">
            <SectionHeading label="Clothing" accent={accent} count={clothingProducts.length} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {clothingProducts.map(p => <ClothingProductCard key={p.id} product={p} accent={accent} />)}
            </div>
          </section>
        )}

        {/* Empty */}
        {digitalProducts.length === 0 && clothingProducts.length === 0 && (
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
    storefront.socialLinks.twitter    && { href: storefront.socialLinks.twitter,    icon: <TwitterIcon />,     label: 'X',        fullLabel: 'Twitter / X' },
    storefront.socialLinks.instagram  && { href: storefront.socialLinks.instagram,  icon: <InstagramIcon />,   label: 'Instagram', fullLabel: 'Instagram' },
    storefront.socialLinks.youtube    && { href: storefront.socialLinks.youtube,    icon: <YouTubeIcon />,     label: 'YouTube',  fullLabel: 'YouTube' },
    storefront.socialLinks.website    && { href: storefront.socialLinks.website,    icon: <Globe size={14} />, label: 'Website',  fullLabel: 'Website' },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; fullLabel: string }[]

  if (storefront.headerLayout === 'centered') {
    return (
      <header className="border-b border-neutral-100 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          {/* Same avatar size as Side layout */}
          <div className="flex-shrink-0 mb-6">
            <div
              className="w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-2xl flex items-center justify-center text-white font-black shadow-xl"
              style={{ backgroundColor: storefront.themeColor, fontSize: 52 }}
            >
              {storefront.title.charAt(0)}
            </div>
          </div>
          {/* Same text sizes as Side layout */}
          <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight">{storefront.title}</h1>
          {storefront.headline && (
            <p className="text-neutral-500 text-sm sm:text-base mt-2 font-semibold leading-snug">{storefront.headline}</p>
          )}
          {storefront.bio && (
            <p className="text-neutral-500 text-sm sm:text-[15px] mt-3 max-w-xl leading-relaxed">{storefront.bio}</p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
              {socialLinks.map((l, i) => (
                <SocialPill key={l.href} {...l} accent={storefront.themeColor} primary={i === 0} />
              ))}
            </div>
          )}
        </div>
      </header>
    )
  }

  // Default: left_avatar (Side)
  return (
    <header className="border-b border-neutral-100 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-start gap-5 sm:gap-8 lg:gap-10">
          <div className="flex-shrink-0">
            <div
              className="w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-2xl flex items-center justify-center text-white font-black shadow-xl"
              style={{ backgroundColor: storefront.themeColor, fontSize: 52 }}
            >
              {storefront.title.charAt(0)}
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight">{storefront.title}</h1>
            {storefront.headline && (
              <p className="text-neutral-500 text-sm sm:text-base mt-2 font-semibold leading-snug">{storefront.headline}</p>
            )}
            {storefront.bio && (
              <p className="text-neutral-500 text-sm sm:text-[15px] mt-3 max-w-xl leading-relaxed">{storefront.bio}</p>
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
      href={href} target="_blank" rel="noopener noreferrer" aria-label={fullLabel}
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
          <div className="aspect-square sm:w-60 sm:aspect-auto sm:h-60 relative overflow-hidden bg-neutral-50 flex-shrink-0">
            <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="lg" />
          </div>
          <div className="p-6 sm:p-8 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: accent + '18', color: accent }}>
                ✦ Featured
              </span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{TYPE_SHORT[product.productType]}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-black leading-tight group-hover:opacity-80 transition-opacity">{product.name}</h3>
            {product.shortDescription && (
              <p className="text-neutral-500 text-sm mt-2 leading-relaxed flex-1 line-clamp-3">{product.shortDescription}</p>
            )}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-black">{formatCurrency(product.price, product.currency)}</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-neutral-400 line-through font-medium">{formatCurrency(product.compareAtPrice)}</span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all group-hover:opacity-90" style={{ backgroundColor: accent }}>
                {product.ctaText} <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Clothing Card (Printify product) ─────────────────────────
function ClothingProductCard({ product, accent }: { product: Product; accent: string }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block h-full">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all duration-200 h-full flex flex-col hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1">
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-50 flex-shrink-0">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <GradientImageFallback productType="bundle" iconSize="lg" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/4 transition-all duration-200" />
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Clothing</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-500 border border-violet-100">
              <Zap size={7} /> Printify
            </span>
          </div>
          <p className="font-bold text-black text-sm sm:text-[15px] leading-snug group-hover:opacity-70 transition-opacity">{product.name}</p>
          {product.shortDescription && (
            <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 flex-1">{product.shortDescription}</p>
          )}
          {product.variants && product.variants.length > 0 && (
            <p className="text-[10px] text-neutral-400">{product.variants.length} sizes available</p>
          )}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-neutral-100">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-black text-base leading-none">{formatCurrency(product.price, product.currency)}</span>
            </div>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all group-hover:opacity-80 flex items-center gap-1" style={{ backgroundColor: accent }}>
              {product.ctaText} <ArrowRight size={9} />
            </span>
          </div>
          <p className="text-[9px] text-neutral-300 flex items-center gap-1">
            <Shirt size={8} /> Fulfilled via Printify
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, accent, featured }: { product: Product; accent: string; featured?: boolean }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block h-full">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all duration-200 h-full flex flex-col hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1">
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-50 flex-shrink-0">
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
          {featured && (
            <div className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>
              ✦ Featured
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/4 transition-all duration-200" />
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-1.5">
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{TYPE_SHORT[product.productType]}</span>
          <p className="font-bold text-black text-sm sm:text-[15px] leading-snug group-hover:opacity-70 transition-opacity">{product.name}</p>
          {product.shortDescription && (
            <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 flex-1">{product.shortDescription}</p>
          )}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-neutral-100">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-black text-base leading-none">{formatCurrency(product.price, product.currency)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
              )}
            </div>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all group-hover:opacity-80 flex items-center gap-1" style={{ backgroundColor: accent }}>
              {product.ctaText} <ArrowRight size={9} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
