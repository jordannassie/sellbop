'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PublicHeader } from '@/components/marketing/public-header'
import { ProductImage } from '@/components/ui/product-image'
import { ProductPriceDisplay } from '@/components/ui/product-price-display'
import { getEffectiveProductPrice } from '@/lib/pricing/product-price'
import {
  MARKETPLACE_CATEGORY_FILTERS,
  normalizeProductCategory,
} from '@/lib/product-categories'

interface MarketplaceProduct {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  coverImage: string | null
  priceCents: number
  saleEnabled: boolean
  salePriceCents: number | null
  saleEndsAt: string | null
  category: string | null
  affiliateEnabled: boolean
  affiliateCommissionPercent: number | null
  storeName: string | null
  storeSlug: string | null
}

function ProductCard({ product }: { product: MarketplaceProduct }) {
  const pricing = getEffectiveProductPrice({
    price_cents: product.priceCents,
    sale_enabled: product.saleEnabled,
    sale_price_cents: product.salePriceCents,
    sale_ends_at: product.saleEndsAt,
  })
  const commPercent = product.affiliateCommissionPercent ?? 0
  const commCents = Math.floor(pricing.effectivePriceCents * (commPercent / 100))

  const displayCategory = normalizeProductCategory(product.category)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md transition-all duration-200">
      {/* Cover image */}
      <Link href={`/p/${product.slug}`}>
        <div className="relative aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
          <ProductImage
            src={product.coverImage}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            iconSize="lg"
          />
          {displayCategory && (
            <div className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)]">
              <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-neutral-700 shadow-sm whitespace-nowrap">
                {displayCategory}
              </span>
            </div>
          )}
          {pricing.isOnSale && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                {pricing.discountPercent}% OFF
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/p/${product.slug}`}>
          <h3 className="font-semibold text-neutral-900 leading-snug line-clamp-2 hover:text-black transition-colors mb-1">
            {product.title}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{product.shortDescription}</p>
        )}

        {product.storeName && (
          <p className="text-xs text-neutral-400 mb-3">
            by{' '}
            {product.storeSlug ? (
              <Link href={`/${product.storeSlug}`} className="hover:text-black hover:underline">
                {product.storeName}
              </Link>
            ) : product.storeName}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <ProductPriceDisplay pricing={pricing} size="sm" showBadge badgeVariant="sale" />
          </div>

          {product.affiliateEnabled && commPercent > 0 && (
            <Link
              href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/p/${product.slug}`}
              className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <TrendingUp size={9} />
              Earn {commPercent}% · {formatCurrency(commCents)}/sale
            </Link>
          )}
        </div>

        <Link
          href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/p/${product.slug}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          View Product <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat && cat !== 'All') params.set('category', cat)
      const res = await fetch(`/api/marketplace?${params}`)
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      setError('Failed to load marketplace.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(query, activeCategory), query ? 350 : 0)
    return () => clearTimeout(timer)
  }, [query, activeCategory, fetchProducts])

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader activeHref="/marketplace" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-2">
            Discover what&apos;s selling.
          </h1>
          <p className="text-neutral-500 text-base max-w-md mx-auto">
            Browse digital products from independent creators. Buy, download, or share and earn.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products, creators, categories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills — horizontal scroll for all 14 categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {MARKETPLACE_CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-black border-black text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">{error}</div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-neutral-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              {query || activeCategory !== 'All' ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-sm text-neutral-500 max-w-xs">
              {query || activeCategory !== 'All'
                ? 'Try a different search or category.'
                : 'Be the first to publish a product on the Sellbop Marketplace.'}
            </p>
            {!query && activeCategory === 'All' && (
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
              >
                Start Selling <ArrowRight size={13} />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-neutral-400">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </>
        )}
      </div>
    </div>
  )
}
