'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/marketing/public-header'
import { formatCurrency } from '@/lib/utils'
import {
  User, Package, Share2, Check, TrendingUp, ArrowRight, Copy, ChevronDown,
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreData {
  slug: string
  name: string
  headline: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
}

interface ProductCard {
  id: string
  title: string
  slug: string
  short_description: string | null
  cover_image_url: string | null
  image_url: string | null
  price_cents: number | null
  affiliate_enabled: boolean
  affiliate_commission_percent: number | null
}

// ── Share Store button ────────────────────────────────────────────────────────

function ShareStoreButton({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/${slug}`
    if (navigator.share) {
      try { await navigator.share({ title: `${name} on Sellbop`, url }); return } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [slug, name])

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/90 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-500 hover:text-black backdrop-blur-sm transition-all"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
      {copied ? 'Copied!' : 'Share Store'}
    </button>
  )
}

// ── Affiliate panel for store-level promote ───────────────────────────────────

function AffiliatePanel({
  products,
  storeName,
  storeSlug,
}: {
  products: ProductCard[]
  storeName: string
  storeSlug: string
}) {
  const [open, setOpen] = useState(false)
  const [linkMap, setLinkMap] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const eligibleProducts = products.filter(p => p.affiliate_enabled && (p.price_cents ?? 0) > 0)
  if (eligibleProducts.length === 0) return null

  // Max commission across all products
  const maxComm = Math.max(...eligibleProducts.map(p => p.affiliate_commission_percent ?? 0))

  async function handleGetLink(product: ProductCard) {
    if (linkMap[product.id]) {
      await navigator.clipboard.writeText(linkMap[product.id])
      setCopiedId(product.id)
      setTimeout(() => setCopiedId(null), 2000)
      return
    }
    setLoadingId(product.id)
    try {
      const res = await fetch('/api/affiliates/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.status === 401) {
        window.location.href = `/login?next=/${storeSlug}`
        return
      }
      const data = await res.json()
      if (data.relationship?.referral_code) {
        const link = `${window.location.origin}/${storeSlug}/${product.slug}?ref=${data.relationship.referral_code}`
        setLinkMap(m => ({ ...m, [product.id]: link }))
        await navigator.clipboard.writeText(link)
        setCopiedId(product.id)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch { /* noop */ } finally { setLoadingId(null) }
  }

  return (
    <div className="border-t border-neutral-100">
      {/* Toggle bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: '#ecfff6' }}>
              <TrendingUp size={14} style={{ color: '#00E676' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-black">
                Earn up to {maxComm}% promoting {storeName}&apos;s products
              </p>
              <p className="text-xs text-neutral-400">
                Share {eligibleProducts.length} product{eligibleProducts.length !== 1 ? 's' : ''} and earn commission on every sale
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:block text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
              style={{ color: '#00A854', borderColor: '#a8ffd6', background: '#ecfff6' }}>
              Promote &amp; Earn
            </span>
            <ChevronDown size={16} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {eligibleProducts.map(product => {
              const commCents = Math.floor((product.price_cents ?? 0) * ((product.affiliate_commission_percent ?? 0) / 100))
              const hasLink = !!linkMap[product.id]
              const isLoading = loadingId === product.id
              const isCopied = copiedId === product.id

              return (
                <div key={product.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                  {/* Product info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                      {(product.cover_image_url ?? product.image_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.cover_image_url ?? product.image_url ?? ''}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={14} className="text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{product.title}</p>
                      <p className="text-xs text-neutral-400">
                        Earn{' '}
                        <span className="font-bold" style={{ color: '#00E676' }}>
                          {formatCurrency(commCents)}/sale
                        </span>
                        {' '}· {product.affiliate_commission_percent}%
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleGetLink(product)}
                    disabled={isLoading}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-50"
                    style={
                      isCopied
                        ? { background: '#ecfff6', color: '#00A854', border: '1px solid #a8ffd6' }
                        : hasLink
                        ? { background: '#000', color: '#fff' }
                        : { background: '#f5f5f5', color: '#000', border: '1px solid #e5e5e5' }
                    }
                  >
                    {isLoading
                      ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                      : isCopied
                      ? <><Check size={12} /> Copied!</>
                      : hasLink
                      ? <><Copy size={12} /> Copy Link</>
                      : <><TrendingUp size={12} /> Get My Link</>}
                  </button>
                </div>
              )
            })}
            <p className="text-xs text-neutral-400 text-center pt-1">
              Links are unique to you · Earn commission on every sale
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main storefront ───────────────────────────────────────────────────────────

export function ClientStorefront({ slug }: { slug: string }) {
  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<ProductCard[]>([])
  const [hasAffiliateProducts, setHasAffiliateProducts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const productsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) { setNotFound(true); setLoading(false); return }

    fetch(`/api/public/store/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setNotFound(true); return }
        setStore(data.store)
        setProducts(data.products ?? [])
        setHasAffiliateProducts(data.hasAffiliateProducts ?? false)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-black mb-2">Store not found</h1>
        <p className="text-neutral-500 mb-6">This creator doesn&apos;t exist or isn&apos;t available.</p>
        <Link href="/marketplace" className="text-sm text-neutral-500 hover:text-black transition-colors">
          ← Browse Marketplace
        </Link>
      </div>
    )
  }

  const singleProduct = products.length === 1

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* ── Hero / Store Banner ───────────────────────────────────── */}
      <div className="relative">
        {/* Banner background */}
        <div
          className="w-full overflow-hidden"
          style={{ height: '160px' }}
        >
          {store.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.banner_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            /* Subtle branded fallback — charcoal with micro-dot pattern */
            <div className="w-full h-full" style={{
              background: '#111111',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
          )}
        </div>

        {/* Creator card — overlaps banner bottom */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center -mt-12 sm:-mt-14 md:-mt-16 pb-8">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white border-[5px] border-white shadow-md flex items-center justify-center mb-4">
              {store.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                  <User size={32} className="text-neutral-400" />
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
              {store.name}
            </h1>

            {/* Handle */}
            <p className="text-sm text-neutral-400 mb-3">@{store.slug}</p>

            {/* Bio */}
            {(store.headline || store.bio) && (
              <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-5">
                {store.headline ?? store.bio}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ShareStoreButton slug={slug} name={store.name} />
              {products.length > 0 && (
                <button
                  onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  Browse Products <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Affiliate Recruitment Strip ───────────────────────────── */}
      {hasAffiliateProducts && (
        <AffiliatePanel
          products={products}
          storeName={store.name}
          storeSlug={slug}
        />
      )}

      {/* ── Products ─────────────────────────────────────────────── */}
      <div ref={productsRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-neutral-100">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-4 text-neutral-200" />
            <h2 className="text-base font-semibold text-black mb-1">No products yet.</h2>
            <p className="text-sm text-neutral-400">Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-lg font-bold text-black">Products</h2>
              <span className="text-sm text-neutral-400">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              className={
                singleProduct
                  ? 'max-w-sm'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
              }
            >
              {products.map(p => {
                const coverUrl = p.cover_image_url ?? p.image_url
                const isFree = (p.price_cents ?? 0) === 0
                const commPercent = p.affiliate_commission_percent ?? 0
                const commCents = Math.floor((p.price_cents ?? 0) * (commPercent / 100))
                const showAffiliate = p.affiliate_enabled && commPercent > 0 && !isFree

                return (
                  <Link key={p.id} href={`/${slug}/${p.slug}`}>
                    <div className="group rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
                      {/* Image — 4:3 */}
                      <div className="relative w-full overflow-hidden bg-neutral-100" style={{ aspectRatio: '4/3' }}>
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={28} className="text-neutral-300" />
                          </div>
                        )}

                        {/* Affiliate badge — overlay */}
                        {showAffiliate && (
                          <div className="absolute top-2.5 right-2.5">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
                              style={{ background: '#000', color: '#00E676' }}
                            >
                              <TrendingUp size={8} />
                              Earn {commPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4">
                        <p className="font-semibold text-black text-sm leading-snug mb-1 group-hover:underline underline-offset-2 line-clamp-2">
                          {p.title}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p className="text-sm font-bold text-black">
                            {isFree ? 'Free' : formatCurrency(p.price_cents ?? 0)}
                          </p>
                          {showAffiliate && (
                            <span className="text-[11px] font-medium" style={{ color: '#00A854' }}>
                              {formatCurrency(commCents)}/sale
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
