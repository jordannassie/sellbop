'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Star, ArrowRight, SlidersHorizontal, X } from 'lucide-react'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import type { ProductType } from '@/lib/domain/entities'

// ─── Mock marketplace data ────────────────────────────────────────────────────
// Each product links directly to its dedicated product page (/p/[slug]).
// The creator name links to the creator's storefront (/store/[handle]).
// This preserves the 3-surface architecture: Marketplace → Product Page → Checkout.

interface MarketProduct {
  id: string
  slug: string          // routes to /p/[slug]
  title: string
  creator: string
  creatorHandle: string // routes to /store/[handle]
  category: string
  productType: ProductType
  price: number
  rating: number
  sales: number
  trending: boolean
  featured: boolean
  tags: string[]
}

const PRODUCTS: MarketProduct[] = [
  // Alex Johnson's real products link to live demo pages (/p/[slug])
  { id: 'mp-1',  slug: 'notion-template-pack',       title: 'Notion Template Pack — 50+ Systems',           creator: 'Alex Johnson',     creatorHandle: 'alexjohnson',   category: 'Templates',     productType: 'digital_download',  price: 2900,  rating: 4.9, sales: 1842, trending: true,  featured: true,  tags: ['notion', 'productivity', 'templates'] },
  { id: 'mp-5',  slug: 'systems-membership',         title: 'Systems Lab — Monthly Membership',             creator: 'Alex Johnson',     creatorHandle: 'alexjohnson',   category: 'Memberships',   productType: 'subscription',      price: 1900,  rating: 4.6, sales: 320,  trending: false, featured: true,  tags: ['productivity', 'community', 'monthly'] },
  { id: 'mp-12', slug: 'creator-bundle',             title: 'Creator Bundle — Everything You Need',         creator: 'Alex Johnson',     creatorHandle: 'alexjohnson',   category: 'Bundles',       productType: 'bundle',            price: 7900,  rating: 4.7, sales: 502,  trending: true,  featured: true,  tags: ['bundle', 'creator', 'starter'] },
  { id: 'mp-3',  slug: 'coaching-call',              title: '1-on-1 Coaching Call — 60 Minutes',            creator: 'Alex Johnson',     creatorHandle: 'alexjohnson',   category: 'Coaching',      productType: 'service_offer',     price: 14900, rating: 5.0, sales: 74,   trending: false, featured: false, tags: ['coaching', 'strategy', 'systems'] },
  // Other creators (demo slugs — product pages not available in demo mode)
  { id: 'mp-2',  slug: '30-day-content-calendar',   title: '30-Day Content Calendar for Creators',         creator: 'Maya Chen',        creatorHandle: 'mayachen',      category: 'Templates',     productType: 'digital_download',  price: 1200,  rating: 4.7, sales: 987,  trending: false, featured: false, tags: ['content', 'social media', 'planning'] },
  { id: 'mp-6',  slug: 'figma-ui-kit-saas',         title: 'Figma UI Kit — SaaS Dashboard Components',    creator: 'Priya Kapoor',     creatorHandle: 'priyakapoor',   category: 'Templates',     productType: 'digital_download',  price: 4900,  rating: 4.9, sales: 1204, trending: true,  featured: false, tags: ['figma', 'ui', 'design'] },
  { id: 'mp-4',  slug: 'youtube-growth-masterclass', title: 'YouTube Growth Masterclass',                  creator: 'Jordan Rivera',    creatorHandle: 'jordanrivera',  category: 'Courses',       productType: 'digital_download',  price: 9700,  rating: 4.8, sales: 512,  trending: true,  featured: false, tags: ['youtube', 'video', 'growth'] },
  { id: 'mp-7',  slug: 'freelance-pricing-templates', title: 'Freelance Pricing & Proposal Templates',     creator: 'Ryan Brooks',      creatorHandle: 'ryanbrooks',    category: 'Templates',     productType: 'digital_download',  price: 1700,  rating: 4.5, sales: 763,  trending: false, featured: false, tags: ['freelance', 'proposals', 'business'] },
  { id: 'mp-8',  slug: 'build-saas-30-days',        title: 'Build a SaaS in 30 Days — Full Course',       creator: 'David Park',       creatorHandle: 'davidpark',     category: 'Courses',       productType: 'digital_download',  price: 14900, rating: 4.8, sales: 398,  trending: true,  featured: false, tags: ['saas', 'coding', 'startup'] },
  { id: 'mp-9',  slug: 'email-copywriting-secrets', title: 'Email Copywriting Secrets',                    creator: 'Lisa Wang',        creatorHandle: 'lisawang',      category: 'Courses',       productType: 'digital_download',  price: 3700,  rating: 4.7, sales: 891,  trending: false, featured: false, tags: ['email', 'copywriting', 'marketing'] },
  { id: 'mp-10', slug: 'weekly-marketing-playbook', title: 'Weekly Marketing Playbook — Subscription',    creator: 'Brandon Torres',   creatorHandle: 'brandontorres', category: 'Subscriptions', productType: 'subscription',      price: 2900,  rating: 4.4, sales: 215,  trending: false, featured: false, tags: ['marketing', 'weekly', 'newsletter'] },
  { id: 'mp-11', slug: 'sermon-series-media-kit',   title: 'Church Sermon Series Media Kit Vol. 2',       creator: 'David Reyes',      creatorHandle: 'davidreyes',    category: 'Templates',     productType: 'bundle',            price: 7900,  rating: 4.9, sales: 143,  trending: false, featured: false, tags: ['church', 'media', 'design'] },
  { id: 'mp-13', slug: 'instagram-reels-scripts',   title: 'Instagram Reels Script Templates',             creator: 'Maya Chen',        creatorHandle: 'mayachen',      category: 'Templates',     productType: 'digital_download',  price: 900,   rating: 4.6, sales: 2341, trending: true,  featured: false, tags: ['instagram', 'reels', 'scripts'] },
  { id: 'mp-14', slug: 'solopreneur-finance-tracker', title: 'Solopreneur Financial Tracker — Notion',    creator: 'Priya Kapoor',     creatorHandle: 'priyakapoor',   category: 'Templates',     productType: 'digital_download',  price: 1400,  rating: 4.8, sales: 634,  trending: false, featured: false, tags: ['finance', 'notion', 'tracking'] },
  { id: 'mp-15', slug: 'launch-checklist-guide',    title: 'Launch Checklist & Strategy Guide',            creator: 'Jordan Rivera',    creatorHandle: 'jordanrivera',  category: 'Courses',       productType: 'digital_download',  price: 2200,  rating: 4.5, sales: 417,  trending: false, featured: false, tags: ['launch', 'strategy', 'guide'] },
  { id: 'mp-16', slug: 'brand-strategy-session',    title: '1-on-1 Brand Strategy Session',                creator: 'Sarah Mitchell',   creatorHandle: 'sarahmitchell', category: 'Coaching',      productType: 'service_offer',     price: 29900, rating: 4.9, sales: 88,   trending: false, featured: false, tags: ['branding', 'strategy', 'coaching'] },
]

const CATEGORIES = ['All', 'Templates', 'Courses', 'Coaching', 'Subscriptions', 'Memberships', 'Bundles']

const SORT_OPTIONS = [
  { label: 'Trending',  value: 'trending' },
  { label: 'Best Rated', value: 'rating' },
  { label: 'Most Sold', value: 'sales' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
]

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <Star size={10} className="fill-amber-400 text-amber-400" />
      <span className="text-[11px] font-semibold text-neutral-600">{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-cyan-100 text-cyan-700','bg-orange-100 text-orange-700','bg-indigo-100 text-indigo-700']
function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
// Card links to /p/[slug] (dedicated product page).
// Creator name is a secondary link to /store/[handle] (creator storefront).

function ProductCard({ product }: { product: MarketProduct }) {
  return (
    <div className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all">
      {/* Card links to product page */}
      <Link href={`/p/${product.slug}`} className="block">
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
          <GradientImageFallback productType={product.productType} />
          {product.trending && (
            <div className="absolute top-2.5 left-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2 py-1 rounded-full">
                <TrendingUp size={9} /> Trending
              </span>
            </div>
          )}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-semibold bg-white/90 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-black leading-snug line-clamp-2 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </div>
      </Link>

      {/* Footer: creator link (storefront) + price */}
      <div className="px-4 pb-4 space-y-2.5">
        {/* Creator → storefront */}
        <Link
          href={`/store/${product.creatorHandle}`}
          className="flex items-center gap-2 w-fit hover:opacity-70 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <Avatar name={product.creator} size={5} />
          <span className="text-xs text-neutral-500 truncate">{product.creator}</span>
        </Link>

        {/* Price + rating */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />
            <span className="text-[11px] text-neutral-400">({product.sales.toLocaleString()})</span>
          </div>
          <span className="text-sm font-bold text-black">
            {formatPrice(product.price)}
            {product.productType === 'subscription' && <span className="text-xs font-normal text-neutral-400">/mo</span>}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Featured Card (large) ────────────────────────────────────────────────────
// Same routing: card → /p/[slug], creator → /store/[handle]

function FeaturedCard({ product }: { product: MarketProduct }) {
  return (
    <div className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all flex flex-col h-full">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="aspect-video relative overflow-hidden bg-neutral-100">
          <GradientImageFallback productType={product.productType} iconSize="lg" />
          {product.trending && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-full">
                <TrendingUp size={9} /> Trending
              </span>
            </div>
          )}
        </div>
        <div className="px-5 pt-5 pb-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{product.category}</span>
            <Stars rating={product.rating} />
          </div>
          <h3 className="text-base font-bold text-black leading-snug line-clamp-2 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </div>
      </Link>
      <div className="px-5 pb-5 flex items-center gap-2 mt-auto pt-3 border-t border-neutral-50 justify-between">
        {/* Creator → storefront */}
        <Link
          href={`/store/${product.creatorHandle}`}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <Avatar name={product.creator} size={6} />
          <span className="text-xs text-neutral-500">{product.creator}</span>
        </Link>
        <span className="text-base font-bold text-black">
          {formatPrice(product.price)}
          {product.productType === 'subscription' && <span className="text-xs font-normal text-neutral-400">/mo</span>}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort]         = useState('trending')

  const featured = PRODUCTS.filter(p => p.featured)

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter(p => !p.featured || category !== 'All' || search)

    if (category !== 'All') list = PRODUCTS.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = (category !== 'All' ? list : PRODUCTS).filter(
        p => p.title.toLowerCase().includes(q) || p.creator.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))
      )
    }

    switch (sort) {
      case 'rating':     return [...list].sort((a, b) => b.rating - a.rating)
      case 'sales':      return [...list].sort((a, b) => b.sales - a.sales)
      case 'price_asc':  return [...list].sort((a, b) => a.price - b.price)
      case 'price_desc': return [...list].sort((a, b) => b.price - a.price)
      default:           return [...list].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0))
    }
  }, [search, category, sort])

  const showFeatured = !search && category === 'All'

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO / SEARCH ─────────────────────────────────────────────── */}
      <section className="border-b border-neutral-100 bg-neutral-50 pt-20 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-3">Marketplace</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-black tracking-tight leading-tight mb-3">
              Discover products by creators
            </h1>
            <p className="text-base text-neutral-500 max-w-xl mx-auto">
              Browse templates, courses, coaching, and subscriptions from independent creators.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-lg mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products, creators, or topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-neutral-200 bg-white rounded-xl pl-10 pr-10 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-6 text-xs text-neutral-400">
            <span>{PRODUCTS.length} products</span>
            <span className="text-neutral-200">·</span>
            <span>{new Set(PRODUCTS.map(p => p.creator)).size} creators</span>
            <span className="text-neutral-200">·</span>
            <span>{CATEGORIES.length - 1} categories</span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── FILTER BAR ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          {/* Category pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={[
                  'px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap',
                  category === cat
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SlidersHorizontal size={13} className="text-neutral-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs text-neutral-600 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-black bg-white"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── FEATURED ──────────────────────────────────────────────────── */}
        {showFeatured && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Handpicked</p>
                <h2 className="text-xl font-bold text-black">Featured right now</h2>
              </div>
              <button
                onClick={() => setCategory('All')}
                className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {featured.map(p => <FeaturedCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── TRENDING BANNER ───────────────────────────────────────────── */}
        {showFeatured && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Trending this week</p>
                <p className="text-xs text-neutral-500">Products getting the most attention right now.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {PRODUCTS.filter(p => p.trending).slice(0, 3).map(p => (
                <span key={p.id} className="text-xs bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-neutral-700 font-medium whitespace-nowrap">
                  {p.title.split(' ').slice(0, 4).join(' ')}…
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── ALL PRODUCTS GRID ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              {search || category !== 'All' ? (
                <h2 className="text-lg font-bold text-black">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  {category !== 'All' && <span className="text-neutral-400 font-normal"> in {category}</span>}
                  {search && <span className="text-neutral-400 font-normal"> for &ldquo;{search}&rdquo;</span>}
                </h2>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Browse</p>
                  <h2 className="text-xl font-bold text-black">All products</h2>
                </>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-2xl">🔍</p>
              <p className="text-base font-semibold text-black">No products found</p>
              <p className="text-sm text-neutral-400">Try a different search term or category.</p>
              <button onClick={() => { setSearch(''); setCategory('All') }} className="mt-2 text-sm font-medium text-black underline underline-offset-2">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* ── SELL CTA ──────────────────────────────────────────────────── */}
        <section className="mt-20 border-t border-neutral-100 pt-14 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Become a creator</p>
          <h2 className="text-3xl font-bold text-black">Sell your own products here</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            List your templates, courses, coaching, or subscriptions and reach buyers on the SellBop.com marketplace.
          </p>
          <Link href="/signup">
            <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors mt-2">
              Start Selling Free <ArrowRight size={14} />
            </span>
          </Link>
          <p className="text-xs text-neutral-400">No monthly fee · 10% + $0.50 per direct sale</p>
        </section>

      </div>
    </div>
  )
}
