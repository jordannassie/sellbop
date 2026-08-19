'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { ProductCardImage } from '@/components/product/product-card-image'
import { ProductPriceDisplay } from '@/components/ui/product-price-display'
import { getEffectiveProductPrice } from '@/lib/pricing/product-price'
import { resolveStoreBannerUrl, STORE_BANNER_BG_CLASS } from '@/lib/store-defaults'
import { SocialIcon, SOCIAL_PLATFORMS } from '@/components/ui/social-icons'
import { stripPartnerSocialLinks } from '@/lib/partner-storage'

export default function PreviewShopPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [store, setStore] = useState<Record<string, unknown> | null>(null)
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return
    fetch(`/api/preview/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setStore(data.store)
        setProducts(data.products ?? [])
      })
      .catch(() => setError('This preview link is invalid or has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading preview…
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Preview unavailable</h1>
          <p className="text-neutral-500 mt-2">{error ?? 'Link not found.'}</p>
        </div>
      </div>
    )
  }

  const socialLinks = stripPartnerSocialLinks((store.social_links as Record<string, string>) ?? {})
  const bannerUrl = resolveStoreBannerUrl(store.banner_url as string | null)
  const name = store.name as string

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white text-center text-sm py-2 px-4">
        Private SellBop Preview — This Shop is not live yet.
      </div>

      <div className={`w-full ${STORE_BANNER_BG_CLASS}`} style={{ aspectRatio: '4/1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 pb-16">
        <div className="flex flex-col items-center text-center">
          {store.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.avatar_url as string} alt={name} className="w-24 h-24 rounded-full border-4 border-white shadow object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-black text-white flex items-center justify-center text-2xl font-bold">{name.charAt(0)}</div>
          )}
          <h1 className="text-2xl font-bold mt-4">{name}</h1>
          {typeof store.bio === 'string' && store.bio && (
            <p className="text-neutral-600 mt-2 max-w-lg">{store.bio}</p>
          )}
          <div className="flex gap-2 mt-4">
            {SOCIAL_PLATFORMS.filter(p => socialLinks[p.key]).map(p => (
              <a key={p.key} href={socialLinks[p.key]} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border flex items-center justify-center">
                <SocialIcon platform={p.key} size={14} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {products.map(p => {
            const pricing = getEffectiveProductPrice({
              price_cents: (p.price_cents as number) ?? 0,
              sale_enabled: !!p.sale_enabled,
              sale_price_cents: (p.sale_price_cents as number | null) ?? null,
              sale_ends_at: (p.sale_ends_at as string | null) ?? null,
            })
            return (
            <div key={p.id as string} className="rounded-xl border border-neutral-200 overflow-hidden">
              <ProductCardImage src={(p.cover_image_url ?? p.image_url) as string | null} alt={p.title as string} />
              <div className="p-4">
                <h3 className="font-semibold">{p.title as string}</h3>
                {typeof p.short_description === 'string' && (
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{p.short_description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <ProductPriceDisplay pricing={pricing} />
                  <span className="text-xs font-medium text-neutral-400 border rounded-lg px-2 py-1">Preview Checkout</span>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
