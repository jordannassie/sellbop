'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/marketing/public-header'
import { formatCurrency } from '@/lib/utils'
import { User, Package, Share2, Check, TrendingUp } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'

interface StoreData {
  slug: string
  name: string
  headline: string | null
  bio: string | null
  avatar_url: string | null
}

interface ProductCard {
  id: string
  title: string
  slug: string
  short_description: string | null
  cover_image_url: string | null
  image_url: string | null
  price_cents: number | null
  affiliate_enabled?: boolean
  affiliate_commission_percent?: number | null
}

function ShareStoreButton({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/${slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} on Sellbop`, url })
        return
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [slug, name])

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-black transition-all"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
      {copied ? 'Copied!' : 'Share Store'}
    </button>
  )
}

export function ClientStorefront({ slug }: { slug: string }) {
  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) { setNotFound(true); setLoading(false); return }

    fetch(`/api/public/store/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setNotFound(true); return }
        setStore(data.store)
        setProducts(data.products ?? [])
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

      {/* ── Creator Header ───────────────────────────────────────── */}
      <div className="border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-100 mb-4 flex items-center justify-center ring-4 ring-white border border-neutral-200">
            {store.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-neutral-400" />
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
            {store.name}
          </h1>

          {/* Handle */}
          <p className="text-sm text-neutral-400 mb-3">
            @{store.slug}
          </p>

          {/* Bio / headline */}
          {(store.headline || store.bio) && (
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-4">
              {store.headline ?? store.bio}
            </p>
          )}

          {/* Share */}
          <ShareStoreButton slug={slug} name={store.name} />
        </div>
      </div>

      {/* ── Products ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {products.length === 0 ? (
          <div className="text-center py-24">
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
                    <div className="group rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all duration-200 overflow-hidden">
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
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <p className="font-semibold text-black text-sm leading-snug mb-1 group-hover:underline underline-offset-2 line-clamp-2">
                          {p.title}
                        </p>
                        {p.short_description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
                            {p.short_description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-black">
                            {isFree ? 'Free' : formatCurrency(p.price_cents ?? 0)}
                          </p>
                          {showAffiliate && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                              style={{ color: '#007038', background: '#ecfff6', borderColor: '#a8ffd6' }}>
                              <TrendingUp size={8} />
                              Earn {commPercent}% · {formatCurrency(commCents)}/sale
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
