'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { BuyButton } from './buy-button'
import {
  Check, Download, Star, Shield, ArrowLeft,
  ChevronRight, Shirt, Zap,
} from 'lucide-react'
import type { Product } from '@/lib/domain/entities'

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital Download',
  service_offer: 'Service',
  subscription: 'Subscription',
  bundle: 'Bundle',
  membership_ready: 'Membership',
}

const TYPE_DELIVERY: Record<string, string> = {
  digital_download: 'Delivered instantly via secure download link',
  service_offer: 'Booking details provided after payment',
  subscription: 'Cancel anytime · Billed monthly',
  bundle: 'All files delivered instantly via download link',
  membership_ready: 'Access granted immediately after payment',
}

// ── Trust Row ─────────────────────────────────────────────────
function TrustRow({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-neutral-500">
      <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  )
}

// ── Printify Thumbnail ────────────────────────────────────────
function ProductHeroImage({ product }: { product: Product }) {
  if (product.source === 'printify' && product.coverImageUrl) {
    return (
      <img
        src={product.coverImageUrl}
        alt={product.name}
        className="w-full h-full object-cover"
      />
    )
  }
  return (
    <ProductImage
      src={product.coverImageUrl}
      alt={product.name}
      productType={product.productType}
      fill
      iconSize="lg"
    />
  )
}

// ── Desktop Buy Card ──────────────────────────────────────────
function DesktopBuyCard({ product, accent, discount }: { product: Product; accent: string; discount: number }) {
  const isPrintify = product.source === 'printify'
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-md">
      <div className="aspect-[16/9] relative border-b border-neutral-100">
        {isPrintify && product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
        )}
      </div>
      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">{formatCurrency(product.price, product.currency)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-neutral-400 line-through font-medium">{formatCurrency(product.compareAtPrice)}</span>
            )}
          </div>
          {discount > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Save {discount}% · {formatCurrency((product.compareAtPrice ?? 0) - product.price)} off
            </p>
          )}
        </div>

        {/* Variants (sizes) for Printify */}
        {isPrintify && product.variants && product.variants.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-neutral-600 mb-2">Available sizes</p>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map(v => (
                <span key={v.id} className="text-xs px-2.5 py-1 border border-neutral-200 rounded-lg text-neutral-700 font-medium">
                  {v.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <BuyButton
          product={{ id: product.id, name: product.name, ctaText: product.ctaText, productType: product.productType }}
          accent={accent}
        />

        <div className="border-t border-neutral-100 pt-4 space-y-2.5">
          {isPrintify ? (
            <>
              <TrustRow icon={<Shirt size={12} />} text="Fulfilled via Printify · Ships directly to you" />
              <TrustRow icon={<Shield size={12} />} text="Secure checkout · Quality guaranteed" />
            </>
          ) : (
            <>
              <TrustRow icon={<Download size={12} />} text={TYPE_DELIVERY[product.productType] ?? 'Delivered after purchase'} />
              <TrustRow icon={<Shield size={12} />} text="Secure checkout · 30-day guarantee" />
              {product.supportEmail && (
                <TrustRow
                  icon={<Check size={12} />}
                  text={<>Questions? <a href={`mailto:${product.supportEmail}`} className="underline hover:text-neutral-700">Email support</a></>}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mobile Buy Card ───────────────────────────────────────────
function MobileBuyCard({ product, accent, discount }: { product: Product; accent: string; discount: number }) {
  const isPrintify = product.source === 'printify'
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-black">{formatCurrency(product.price, product.currency)}</span>
        {product.compareAtPrice && <span className="text-sm text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}
        {discount > 0 && <span className="text-xs text-emerald-600 font-semibold">−{discount}%</span>}
      </div>
      <BuyButton
        product={{ id: product.id, name: product.name, ctaText: product.ctaText, productType: product.productType }}
        accent={accent}
      />
      <p className="text-xs text-neutral-400 text-center">
        {isPrintify ? 'Fulfilled via Printify · Ships to you' : (TYPE_DELIVERY[product.productType] ?? 'Delivered after purchase')}
      </p>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-100 h-[52px]" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3 space-y-6">
            <div className="aspect-[4/3] rounded-2xl bg-neutral-100" />
            <div className="space-y-3">
              <div className="h-4 w-24 bg-neutral-100 rounded-full" />
              <div className="h-8 w-3/4 bg-neutral-200 rounded-xl" />
              <div className="h-4 w-full bg-neutral-100 rounded-full" />
              <div className="h-4 w-5/6 bg-neutral-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Not Found ─────────────────────────────────────────────────
function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">✦</div>
      <h1 className="text-2xl font-bold text-black mb-2">Product not found</h1>
      <p className="text-neutral-500 text-sm mb-6">
        We couldn&apos;t find a product at <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">/p/{slug}</code>.
        It may be a draft or hasn&apos;t been synced yet.
      </p>
      <Link
        href={`/store/${DEMO_SELLER_PROFILE.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-black underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={13} /> Back to store
      </Link>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────
export function ClientProductPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined)

  useEffect(() => {
    demoProductRepo.findBySlug(slug).then(p => {
      // Show published products only (match server behavior)
      setProduct(p && p.status === 'published' ? p : null)
    })
  }, [slug])

  // Still loading
  if (product === undefined) return <Skeleton />

  // Not found
  if (product === null) return <NotFound slug={slug} />

  const seller     = DEMO_SELLER_PROFILE
  const storefront = DEMO_STOREFRONT
  const accent     = storefront.themeColor
  const isPrintify = product.source === 'printify'

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0

  // Build description bullets (sanitize HTML tags from Printify descriptions)
  const cleanDesc = product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const bullets = cleanDesc
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 4)

  const typeLabel = isPrintify ? 'Clothing' : (TYPE_LABELS[product.productType] ?? 'Product')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <SellBopLogo size="lg" />
            <span className="hidden sm:block text-neutral-200 text-lg font-light">/</span>
            <Link
              href={`/store/${seller.slug}`}
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
            >
              {seller.displayName}
            </Link>
          </div>
          <Link
            href={`/store/${seller.slug}`}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={12} /> Back to store
          </Link>
        </div>
      </nav>

      {/* Mobile buy card */}
      <div className="lg:hidden border-b border-neutral-100 bg-neutral-50 px-4 py-4">
        <MobileBuyCard product={product} accent={accent} discount={discount} />
      </div>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12">

          {/* Left: product content */}
          <div className="lg:col-span-3 space-y-8">

            {/* Hero image */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-100 relative shadow-sm">
              <ProductHeroImage product={product} />
            </div>

            {/* Gallery images (Printify) */}
            {isPrintify && product.galleryImageUrls && product.galleryImageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {product.galleryImageUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-100">
                    <img src={url} alt={`${product.name} view ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: accent + '15', color: accent }}
                >
                  {typeLabel}
                </span>
                {isPrintify && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                    <Zap size={9} /> Printify · Fulfilled via Printify
                  </span>
                )}
                {!isPrintify && product.salesCount > 50 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {product.salesCount.toLocaleString()}+ buyers
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight mb-3">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-base text-neutral-600 leading-relaxed font-medium mb-4">
                  {product.shortDescription}
                </p>
              )}

              <p className="text-sm text-neutral-600 leading-relaxed">
                {cleanDesc || product.name}
              </p>
            </div>

            {/* What's included / Sizes */}
            {isPrintify && product.variants && product.variants.length > 0 ? (
              <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 bg-neutral-50/50">
                <h2 className="text-sm font-bold text-black mb-4 flex items-center gap-2">
                  <Shirt size={14} /> Available sizes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <span key={v.id} className="text-sm px-3 py-1.5 border border-neutral-200 rounded-xl text-neutral-700 font-medium bg-white">
                      {v.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-4 flex items-center gap-1">
                  <Zap size={10} className="text-violet-400" />
                  Printed and shipped by Printify
                </p>
              </div>
            ) : bullets.length > 0 ? (
              <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 bg-neutral-50/50">
                <h2 className="text-sm font-bold text-black mb-4">What&apos;s included</h2>
                <ul className="space-y-3">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: accent + '18' }}
                      >
                        <Check size={11} style={{ color: accent }} />
                      </span>
                      {b}
                    </li>
                  ))}
                  {product.fileAssetIds.length > 0 && (
                    <li className="flex items-start gap-3 text-sm text-neutral-700">
                      <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Download size={11} className="text-blue-500" />
                      </span>
                      {product.fileAssetIds.length} file{product.fileAssetIds.length > 1 ? 's' : ''} delivered instantly
                    </li>
                  )}
                </ul>
              </div>
            ) : null}

            {/* Creator card */}
            <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-sm"
                style={{ backgroundColor: accent }}
              >
                {seller.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-black">{seller.displayName}</p>
                  <Link
                    href={`/store/${seller.slug}`}
                    className="flex items-center gap-0.5 text-xs font-semibold text-neutral-400 hover:text-black transition-colors flex-shrink-0"
                  >
                    View store <ChevronRight size={12} />
                  </Link>
                </div>
                {seller.bio && (
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">{seller.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: sticky buy card (desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-[72px]">
              <DesktopBuyCard product={product} accent={accent} discount={discount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
