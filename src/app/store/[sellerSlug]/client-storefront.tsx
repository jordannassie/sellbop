'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { getEffectiveProductPrice } from '@/lib/pricing/product-price'
import { ProductCardImage } from '@/components/product/product-card-image'
import { ProductPriceDisplay } from '@/components/ui/product-price-display'
import { User, Package } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'
import { resolveStoreBannerUrl, STORE_BANNER_BG_CLASS } from '@/lib/store-defaults'

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
  sale_enabled?: boolean
  sale_price_cents?: number | null
  sale_ends_at?: string | null
}

export function ClientStorefront({ slug }: { slug: string }) {
  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNotFound(true)
      setLoading(false)
      return
    }

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
        <h1 className="text-2xl font-bold text-black mb-2">Store not found</h1>
        <p className="text-neutral-500 mb-6">This store doesn&apos;t exist or isn&apos;t available.</p>
        <Link href="/" className="text-sm text-neutral-600 hover:text-black transition-colors">
          ← Back to Sellbop
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/"><SellBopLogo size="sm" /></Link>
        </div>
      </div>

      {/* Banner */}
      <div className={`w-full h-40 sm:h-56 overflow-hidden ${STORE_BANNER_BG_CLASS}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolveStoreBannerUrl(store.banner_url)} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Creator header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center py-10 border-b border-neutral-100">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-200 mb-4 flex items-center justify-center">
            {store.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-neutral-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-black mb-1">{store.name}</h1>
          {store.headline && <p className="text-base text-neutral-500 mb-2">{store.headline}</p>}
          {store.bio && <p className="text-sm text-neutral-400 max-w-md">{store.bio}</p>}
        </div>

        {/* Products */}
        <div className="py-10">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="mx-auto mb-3 text-neutral-200" />
              <p className="text-neutral-500">No products available yet.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">
                {products.length} Product{products.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(p => {
                  const coverUrl = p.cover_image_url ?? p.image_url
                  const pricing = getEffectiveProductPrice(p)
                  return (
                    <Link key={p.id} href={`/p/${p.slug}`}>
                      <div className="group rounded-2xl border border-neutral-200 bg-white hover:shadow-md hover:border-neutral-300 transition-all overflow-hidden">
                        <ProductCardImage src={coverUrl} alt={p.title} hoverScale />
                        <div className="p-4">
                          <p className="font-semibold text-black text-sm mb-1 group-hover:underline underline-offset-2 truncate">
                            {p.title}
                          </p>
                          {p.short_description && (
                            <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{p.short_description}</p>
                          )}
                          <ProductPriceDisplay pricing={pricing} size="sm" showBadge badgeVariant="sale" />
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
    </div>
  )
}
