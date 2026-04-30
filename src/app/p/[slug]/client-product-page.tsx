'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { BuyButton } from './buy-button'
import {
  Check, Download, Star, Shield, ArrowLeft, ChevronRight,
  Shirt, Zap, Plus, Minus, ChevronDown,
} from 'lucide-react'
import {
  printifyColors,
  printifySizes,
  printifyMinPrice,
  printifyMaxPrice,
  printifyHasPriceRange,
} from '@/lib/printify/normalize'
import type { Product, ProductVariant } from '@/lib/domain/entities'

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&reg;/g, '\u00AE')
    .replace(/&trade;/g, '\u2122')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function cleanText(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

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
        We couldn&apos;t find a product at{' '}
        <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">/p/{slug}</code>.
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

// ── Trust Row ─────────────────────────────────────────────────
function TrustRow({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-neutral-500">
      <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  )
}

// ── Clean dropdown selector ────────────────────────────────────
function SelectDropdown({
  label, value, onChange, options, placeholder, disabled = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3.5 py-3 border-2 rounded-xl text-sm font-medium appearance-none bg-white
            focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors ${
            disabled
              ? 'border-neutral-100 text-neutral-300 cursor-not-allowed bg-neutral-50'
              : value
                ? 'border-black text-black'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            disabled ? 'text-neutral-200' : 'text-neutral-400'
          }`}
        />
      </div>
    </div>
  )
}

// ── Merch variant selector ─────────────────────────────────────
function MerchVariantSelector({
  product,
  onVariantChange,
  onQtyChange,
  accent,
}: {
  product: Product
  onVariantChange: (v: ProductVariant | null) => void
  onQtyChange: (q: number) => void
  accent: string
}) {
  const variants  = product.variants
  const colors    = useMemo(() => printifyColors(variants), [variants])
  const hasColors = colors.length > 0

  // Auto-preselect when only one option exists
  const [selectedColor, setSelectedColor] = useState<string>(
    hasColors && colors.length === 1 ? colors[0] : '',
  )
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [qty, setQty]                   = useState(1)

  const availableSizes = useMemo(
    () => printifySizes(variants, selectedColor || undefined),
    [variants, selectedColor],
  )

  // Auto-preselect size when only one is available
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (availableSizes.length === 1 && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [availableSizes, selectedSize])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Derive the matching variant from current selections
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!selectedSize) return null
    return variants.find(v => {
      const colorMatch = hasColors ? v.color === selectedColor : true
      const sizeMatch  = (v.size ?? v.name) === selectedSize
      return colorMatch && sizeMatch
    }) ?? null
  }, [variants, selectedColor, selectedSize, hasColors])

  useEffect(() => { onVariantChange(selectedVariant) }, [selectedVariant, onVariantChange])
  useEffect(() => { onQtyChange(qty) }, [qty, onQtyChange])

  function handleColorChange(color: string) {
    setSelectedColor(color)
    // Reset size if it's unavailable for the new color
    if (selectedSize) {
      const sizesForColor = printifySizes(variants, color || undefined)
      if (!sizesForColor.includes(selectedSize)) setSelectedSize('')
    }
  }

  // Price: show selected variant price, or "From $X" range
  const minPrice   = printifyMinPrice(variants)
  const maxPrice   = printifyMaxPrice(variants)
  const hasRange   = printifyHasPriceRange(variants)
  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price, product.currency)
    : hasRange
      ? `From ${formatCurrency(minPrice, product.currency)}`
      : formatCurrency(minPrice, product.currency)

  return (
    <div className="space-y-4">
      {/* Price — prominent */}
      <div className="flex items-baseline gap-2 pb-1">
        <span className="text-3xl font-black text-black tracking-tight">{displayPrice}</span>
        {!selectedVariant && hasRange && (
          <span className="text-sm text-neutral-400 font-medium">
            – {formatCurrency(maxPrice, product.currency)}
          </span>
        )}
      </div>

      {/* Color dropdown */}
      {hasColors && (
        <SelectDropdown
          label="Color"
          value={selectedColor}
          onChange={handleColorChange}
          options={colors}
          placeholder="Select a color"
        />
      )}

      {/* Size dropdown */}
      <SelectDropdown
        label="Size"
        value={selectedSize}
        onChange={setSelectedSize}
        options={availableSizes}
        placeholder={hasColors && !selectedColor ? 'Select color first' : 'Select a size'}
        disabled={hasColors && !selectedColor}
      />

      {/* Quantity stepper */}
      <div>
        <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-xl border-2 border-neutral-200 flex items-center justify-center hover:border-neutral-400 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-base font-bold w-8 text-center tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(q => Math.min(10, q + 1))}
            className="w-10 h-10 rounded-xl border-2 border-neutral-200 flex items-center justify-center hover:border-neutral-400 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Buy button */}
      <MerchBuyButton
        product={product}
        selectedVariant={selectedVariant}
        quantity={qty}
        accent={accent}
        hasColors={hasColors}
        selectedColor={selectedColor}
      />

      {/* Fulfillment note */}
      <p className="text-xs text-neutral-400 flex items-center gap-1.5 pt-1">
        <Shirt size={11} />
        Printed on demand · Fulfilled by Printify · Ships to your door
      </p>
    </div>
  )
}

// ── Merch buy button ───────────────────────────────────────────
function MerchBuyButton({
  product,
  selectedVariant,
  quantity,
  accent,
  hasColors,
  selectedColor,
}: {
  product: Product
  selectedVariant: ProductVariant | null
  quantity: number
  accent: string
  hasColors: boolean
  selectedColor: string   // empty string = nothing selected
}) {
  const router  = useRouter()
  const isReady = selectedVariant !== null

  let helperText = ''
  if (hasColors && !selectedColor)  helperText = 'Choose a color to continue'
  else if (!selectedVariant)        helperText = 'Choose a size to continue'

  function handleBuy() {
    if (!selectedVariant) return
    const params = new URLSearchParams({
      variant: selectedVariant.id,
      qty: String(quantity),
    })
    router.push(`/checkout/merch/${product.id}?${params}`)
  }

  return (
    <div className="space-y-2 pt-1">
      <button
        type="button"
        onClick={handleBuy}
        disabled={!isReady}
        className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all ${
          isReady
            ? 'hover:opacity-90 active:scale-[0.99] shadow-sm'
            : 'opacity-30 cursor-not-allowed'
        }`}
        style={{ backgroundColor: accent }}
      >
        {isReady
          ? `Buy Now — ${formatCurrency(selectedVariant.price * quantity, product.currency)}`
          : 'Select options to continue'}
      </button>
      {helperText && (
        <p className="text-xs text-neutral-400 text-center">{helperText}</p>
      )}
    </div>
  )
}

// ── Merch product page ─────────────────────────────────────────
function MerchProductPage({ product, accent }: { product: Product; accent: string }) {
  const seller  = DEMO_SELLER_PROFILE
  const variants = product.variants

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty]                          = useState(1)
  const [activeImage, setActiveImage]          = useState<string | null>(
    product.coverImageUrl,
  )

  // Update hero image when variant changes (use variant-specific image if available)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedVariant) {
      setActiveImage(product.coverImageUrl)
      return
    }
    // Look for an image whose title/position hints at the variant color
    const colorHint = selectedVariant.color?.toLowerCase()
    if (colorHint && product.galleryImageUrls.length > 0) {
      // Heuristic: pick first gallery image for now (variant_ids mapping would require raw API data)
      setActiveImage(product.coverImageUrl)
    }
  }, [selectedVariant, product])
  /* eslint-enable react-hooks/set-state-in-effect */

  const cleanDesc = cleanText(product.description)
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...product.galleryImageUrls,
  ]

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

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">

          {/* Left: images */}
          <div className="space-y-3 mb-8 lg:mb-0">
            <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-100 shadow-sm bg-neutral-50">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Shirt size={64} />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 4).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(url)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === url ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: info + variant selector */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ backgroundColor: accent + '15', color: accent }}
              >
                Clothing
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                <Zap size={9} /> Printify
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight mb-2">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-sm text-neutral-500 leading-relaxed">{product.shortDescription}</p>
              )}
            </div>

            {/* Variant selector + buy */}
            <MerchVariantSelector
              product={product}
              onVariantChange={setSelectedVariant}
              onQtyChange={setQty}
              accent={accent}
            />

            {/* Description */}
            {cleanDesc && cleanDesc !== product.name && (
              <div className="border-t border-neutral-100 pt-5">
                <p className="text-sm text-neutral-600 leading-relaxed">{cleanDesc}</p>
              </div>
            )}

            {/* Creator */}
            <div className="border border-neutral-100 rounded-2xl p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
                style={{ backgroundColor: accent }}
              >
                {seller.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-black">{seller.displayName}</p>
                  <Link
                    href={`/store/${seller.slug}`}
                    className="flex items-center gap-0.5 text-xs font-semibold text-neutral-400 hover:text-black transition-colors flex-shrink-0"
                  >
                    View store <ChevronRight size={12} />
                  </Link>
                </div>
                {seller.bio && (
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed line-clamp-2">{seller.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reviews section ───────────────────────────────────────────
interface DemoReview {
  name: string
  rating: number
  message: string
  date: string
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
        />
      ))}
    </div>
  )
}

function ReviewsSection({ product }: { product: Product }) {
  // Demo reviews shown when product has sales. Real reviews come from Supabase product_reviews table.
  const demoReviews: DemoReview[] = product.salesCount > 0
    ? [
        { name: 'Sarah K.',    rating: 5, message: 'Exactly what I needed. Saved me hours of work.', date: 'Apr 2026' },
        { name: 'Marcus T.',   rating: 5, message: 'Super well organized and easy to customize. 100% recommend.', date: 'Mar 2026' },
        { name: 'Priya M.',    rating: 4, message: 'Great value for the price. Would buy again.', date: 'Mar 2026' },
      ]
    : []

  if (demoReviews.length === 0) return null

  const avgRating = demoReviews.reduce((sum, r) => sum + r.rating, 0) / demoReviews.length

  return (
    <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-black">What customers say</h2>
        <div className="flex items-center gap-1.5">
          <ReviewStars rating={Math.round(avgRating)} />
          <span className="text-xs text-neutral-500 font-medium">
            {avgRating.toFixed(1)} · {demoReviews.length} reviews
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {demoReviews.map((r, i) => (
          <div key={i} className="pb-4 border-b border-neutral-50 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                  {r.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-black">{r.name}</span>
              </div>
              <ReviewStars rating={r.rating} />
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed ml-8">{r.message}</p>
            <p className="mt-1 text-[10px] text-neutral-400 ml-8">{r.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Digital product page (unchanged layout) ───────────────────
function DigitalProductPage({ product, accent }: { product: Product; accent: string }) {
  const seller   = DEMO_SELLER_PROFILE
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0

  const cleanDesc = cleanText(product.description)
  const bullets   = cleanDesc
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 4)

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
          <p className="text-xs text-neutral-400 text-center">{TYPE_DELIVERY[product.productType] ?? 'Delivered after purchase'}</p>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3 space-y-8">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-100 relative shadow-sm">
              <ProductImage src={product.coverImageUrl} alt={product.name} productType={product.productType} fill iconSize="lg" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: accent + '15', color: accent }}>
                  {TYPE_LABELS[product.productType] ?? 'Product'}
                </span>
                {product.salesCount > 50 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {product.salesCount.toLocaleString()}+ buyers
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight mb-3">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-base text-neutral-600 leading-relaxed font-medium mb-4">{product.shortDescription}</p>
              )}
              <p className="text-sm text-neutral-600 leading-relaxed">{cleanDesc || product.name}</p>
            </div>

            {bullets.length > 0 && (
              <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 bg-neutral-50/50">
                <h2 className="text-sm font-bold text-black mb-4">What&apos;s included</h2>
                <ul className="space-y-3">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: accent + '18' }}>
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
            )}

            <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-sm" style={{ backgroundColor: accent }}>
                {seller.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-black">{seller.displayName}</p>
                  <Link href={`/store/${seller.slug}`} className="flex items-center gap-0.5 text-xs font-semibold text-neutral-400 hover:text-black transition-colors flex-shrink-0">
                    View store <ChevronRight size={12} />
                  </Link>
                </div>
                {seller.bio && <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">{seller.bio}</p>}
              </div>
            </div>

            <LiveReviewsSection productSlug={product.slug} />
            <ReviewsSection product={product} />
          </div>

          {/* Desktop buy card */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-[72px] bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-md">
              <div className="aspect-[16/9] relative border-b border-neutral-100">
                <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="md" />
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{formatCurrency(product.price, product.currency)}</span>
                    {product.compareAtPrice && <span className="text-base text-neutral-400 line-through font-medium">{formatCurrency(product.compareAtPrice)}</span>}
                  </div>
                  {discount > 0 && <p className="text-xs text-emerald-600 font-semibold mt-1">Save {discount}% · {formatCurrency((product.compareAtPrice ?? 0) - product.price)} off</p>}
                </div>
                <BuyButton product={{ id: product.id, name: product.name, ctaText: product.ctaText, productType: product.productType }} accent={accent} />
                <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                  <TrustRow icon={<Download size={12} />} text={TYPE_DELIVERY[product.productType] ?? 'Delivered after purchase'} />
                  <TrustRow icon={<Shield size={12} />} text="Secure checkout · 30-day guarantee" />
                  {product.supportEmail && (
                    <TrustRow icon={<Check size={12} />} text={<>Questions? <a href={`mailto:${product.supportEmail}`} className="underline hover:text-neutral-700">Email support</a></>} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Affiliate click tracker ────────────────────────────────────
function useAffiliateTracking(slug: string) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const affCode = params.get('aff')
    if (!affCode) return

    // Persist code for checkout to pick up
    try {
      sessionStorage.setItem('sellbop_aff_code', affCode)
      sessionStorage.setItem('sellbop_aff_slug', slug)
    } catch { /* storage unavailable */ }

    // Fire-and-forget click record
    fetch('/api/v5/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateCode: affCode, productSlug: slug, referrerUrl: document.referrer || undefined }),
    }).catch(() => { /* best-effort */ })
  }, [slug])
}

// ── Live reviews section ───────────────────────────────────────
function LiveReviewsSection({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<Array<{ id: string; customer_name: string; rating: number; message: string; created_at: string }>>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/v5/public-reviews?slug=${encodeURIComponent(productSlug)}`)
      .then(r => r.json())
      .then((data: { reviews?: Array<{ id: string; customer_name: string; rating: number; message: string; created_at: string }> }) => {
        if (active) setReviews(data.reviews ?? [])
      })
      .catch(() => { /* Supabase not available */ })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [productSlug])

  if (!loaded || reviews.length === 0) return null

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div className="border border-neutral-100 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-black">What customers say</h2>
        <div className="flex items-center gap-1.5">
          <ReviewStars rating={Math.round(avgRating)} />
          <span className="text-xs text-neutral-500 font-medium">
            {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="pb-4 border-b border-neutral-50 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                  {r.customer_name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-black">{r.customer_name}</span>
              </div>
              <ReviewStars rating={r.rating} />
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed ml-8">{r.message}</p>
            <p className="mt-1 text-[10px] text-neutral-400 ml-8">
              {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────
export function ClientProductPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined)

  useAffiliateTracking(slug)

  useEffect(() => {
    demoProductRepo.findBySlug(slug).then(p => {
      setProduct(p && p.status === 'published' ? p : null)
    })
  }, [slug])

  if (product === undefined) return <Skeleton />
  if (product === null)      return <NotFound slug={slug} />

  const accent = DEMO_STOREFRONT.themeColor

  if (product.source === 'printify') {
    return <MerchProductPage product={product} accent={accent} />
  }

  return <DigitalProductPage product={product} accent={accent} />
}
