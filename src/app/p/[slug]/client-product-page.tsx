'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Download, ArrowRight, User, TrendingUp, Check, Copy, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/env'
import { getEffectiveProductPrice } from '@/lib/pricing/product-price'
import { ProductPriceDisplay } from '@/components/ui/product-price-display'
import { ProductMediaGalleryViewer } from '@/components/product-media/product-media-gallery-viewer'
import { ProductDescriptionMarkdown } from '@/components/product/product-description-markdown'
import { ProductReviewsCard } from '@/components/product/product-reviews-card'
import { AvatarWithPartnerBadge } from '@/components/ui/avatar-with-partner-badge'
import { PRODUCT_IMAGE_ASPECT_RATIO } from '@/lib/product-media/constants'
import type { ProductReviewItem } from '@/lib/product-reviews/defaults'
import type { ProductMediaItem } from '@/lib/product-media/types'

interface ProductData {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  cover_image_url: string | null
  image_url: string | null
  price_cents: number | null
  sale_enabled?: boolean
  sale_price_cents?: number | null
  sale_ends_at?: string | null
  is_live: boolean
  affiliate_enabled?: boolean
  affiliate_commission_percent?: number | null
}

interface StoreData {
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  is_partner?: boolean
  show_partner_badge?: boolean
}

type State = 'loading' | 'notfound' | 'ready' | 'entering_email' | 'processing' | 'success' | 'stripe_required'

interface SuccessData {
  orderId: string
  productId: string
  productSlug: string
  email: string
  accessUrl: string
  emailSent: boolean
}

export function ClientProductPage({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
  const [state, setState] = useState<State>('loading')
  const [product, setProduct] = useState<ProductData | null>(null)
  const [store, setStore] = useState<StoreData | null>(null)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [error, setError] = useState('')
  const [promoteExpanded, setPromoteExpanded] = useState(false)
  const [promoteLoading, setPromoteLoading] = useState(false)
  const [affiliateUrl, setAffiliateUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [media, setMedia] = useState<ProductMediaItem[]>([])
  const [reviews, setReviews] = useState<ProductReviewItem[]>([])

  const pricing = product
    ? getEffectiveProductPrice(product)
    : getEffectiveProductPrice({ price_cents: 0 })
  const isFree = pricing.effectivePriceCents === 0
  const affiliateEnabled = product?.affiliate_enabled ?? false
  const commPercent = product?.affiliate_commission_percent ?? 0
  const commCents = Math.floor(pricing.effectivePriceCents * (commPercent / 100))

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState('notfound')
      return
    }

    fetch(`/api/public/products/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setState('notfound'); return }
        setProduct(data.product)
        setStore(data.store)
        setMedia(data.media ?? [])
        setReviews(data.reviews ?? [])
        setState('ready')

        // Record affiliate click server-side (fire and forget)
        if (refCode) {
          fetch('/api/affiliates/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referralCode: refCode,
              landingUrl: window.location.href,
            }),
          }).catch(() => {/* best effort */})
        }
      })
      .catch(() => setState('notfound'))
  }, [slug, refCode])

  async function handlePromoteEarn() {
    if (promoteExpanded) { setPromoteExpanded(false); return }
    setPromoteExpanded(true)
    if (affiliateUrl || !product) return
    setPromoteLoading(true)
    try {
      const res = await fetch('/api/affiliates/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.status === 401) {
        // Not logged in — redirect to login then back
        window.location.href = `/login?next=/p/${slug}`
        return
      }
      const data = await res.json()
      if (data.relationship) {
        setAffiliateUrl(`${window.location.origin}/p/${product.slug}?ref=${data.relationship.referral_code}`)
      }
    } catch { /* noop */ } finally {
      setPromoteLoading(false)
    }
  }

  async function handleCopyAffiliateLink() {
    if (!affiliateUrl) return
    await navigator.clipboard.writeText(affiliateUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleShareAffiliateLink() {
    if (!affiliateUrl) return
    if (navigator.share) {
      try { await navigator.share({ url: affiliateUrl }) } catch { /* cancelled */ }
    } else {
      handleCopyAffiliateLink()
    }
  }

  async function handleFreeCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !buyerEmail.trim()) return
    setState('processing')
    setError('')

    try {
      const res = await fetch('/api/checkout/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          buyerEmail: buyerEmail.trim(),
          buyerName: buyerName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.already_acquired && data.access_url) {
        setSuccess({
          orderId: data.order_id,
          productId: product.id,
          productSlug: product.slug,
          email: buyerEmail,
          accessUrl: data.access_url,
          emailSent: false,
        })
        setState('success')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')

      setSuccess({
        orderId: data.order_id,
        productId: product.id,
        productSlug: product.slug,
        email: buyerEmail,
        accessUrl: data.access_url,
        emailSent: !!data.email_sent,
      })
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('entering_email')
    }
  }

  async function handlePaidCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !buyerEmail.trim()) return
    setState('processing')
    setError('')

    try {
      const res = await fetch('/api/checkout/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          buyerEmail: buyerEmail.trim(),
          buyerName: buyerName.trim() || undefined,
          refCode: refCode || undefined,
        }),
      })
      const data = await res.json()

      if (data.stripe_required) {
        setState('stripe_required')
        return
      }
      if (data.free_checkout && data.access_url) {
        setSuccess({
          orderId: data.order_id,
          productId: product.id,
          productSlug: product.slug,
          email: buyerEmail,
          accessUrl: data.access_url,
          emailSent: !!data.email_sent,
        })
        setState('success')
        return
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }
      throw new Error(data.error ?? 'Checkout unavailable.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('entering_email')
    }
  }

  const coverUrl = product?.cover_image_url ?? product?.image_url

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
        <h1 className="text-2xl font-bold text-black mb-2">Product not found</h1>
        <p className="text-neutral-500 mb-6">This product doesn&apos;t exist or isn&apos;t available.</p>
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    )
  }

  if (state === 'success' && success) {
    const showShareEarn = affiliateEnabled && commPercent > 0 && !isFree

    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <SellBopLogo size="lg" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download size={24} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Purchase complete</h1>
              <p className="text-neutral-500">{product?.title}</p>
            </div>

            <a href={success.accessUrl} className="block mb-4">
              <Button className="w-full" size="lg">
                Access Your Product <ArrowRight size={16} />
              </Button>
            </a>
            <p className="text-xs text-neutral-500 text-center mb-4">
              {success.emailSent
                ? <>Your receipt and access link were sent to <strong>{success.email}</strong>.</>
                : <>Your purchase is complete. Access your product above.</>}
            </p>
            <Link href="/login?next=/dashboard/library" className="block text-center text-xs text-neutral-400 hover:text-black mb-4">
              Sign in to save purchases in your Library
            </Link>
            {error && <p className="text-xs text-red-500 mb-4 text-center">{error}</p>}

            {showShareEarn && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <TrendingUp size={20} className="mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800 mb-1">
                  Earn {commPercent}% sharing this product
                </p>
                <p className="text-xs text-emerald-700 mb-3">
                  {formatCurrency(commCents)} per sale when someone buys through your link.
                </p>
                {affiliateUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
                      <p className="truncate text-[11px] font-mono text-neutral-500">{affiliateUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyAffiliateLink}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'COPY MY LINK'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePromoteEarn}
                    disabled={promoteLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {promoteLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <TrendingUp size={14} />
                    )}
                    Get My Affiliate Link
                  </button>
                )}
              </div>
            )}

            {store && (
              <div className="mt-4 text-center">
                <Link href={`/${store.slug}`} className="text-sm text-neutral-500 hover:text-black transition-colors">
                  Visit {store.name}&apos;s store
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (state === 'stripe_required') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <SellBopLogo size="lg" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={24} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-black mb-2">Payments coming soon</h1>
            <p className="text-neutral-500 mb-6">
              This seller hasn&apos;t set up Stripe payments yet. Check back soon!
            </p>
            <Button variant="secondary" onClick={() => setState('ready')}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <SellBopLogo size="lg" />
          {store && (
            <Link href={`/${store.slug}`} className="text-sm text-neutral-500 hover:text-black transition-colors">
              {store.name}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left: product info */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Creator */}
            {store && (
              <Link href={`/${store.slug}`} className="flex items-center gap-2 mb-6 group">
                <AvatarWithPartnerBadge
                  isPartner={store.is_partner}
                  showPartnerBadge={store.show_partner_badge}
                  badgeScale={0.36}
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
                    {store.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={14} className="text-neutral-400" />
                      </div>
                    )}
                  </div>
                </AvatarWithPartnerBadge>
                <span className="text-sm text-neutral-600 group-hover:text-black transition-colors">{store.name}</span>
              </Link>
            )}

            {/* Cover image */}
            {media.length > 0 ? (
              <div className="max-w-lg w-full mb-6">
                <ProductMediaGalleryViewer
                  items={media}
                  aspectStyle={{ aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO }}
                  mainObjectFit="cover"
                  enableLightbox
                />
              </div>
            ) : coverUrl ? (
              <div
                className="max-w-lg w-full rounded-2xl overflow-hidden bg-neutral-100 mb-6"
                style={{ aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt={product?.title} className="w-full h-full object-cover" />
              </div>
            ) : null}

            {/* Title & description */}
            <h1 className="text-3xl font-bold text-black mb-4">{product?.title}</h1>
            {product?.description && (
              <ProductDescriptionMarkdown content={product.description} />
            )}
          </div>

          {/* Right: buy box */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-6 space-y-3">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              {/* Price */}
              <div className="mb-5">
                <ProductPriceDisplay pricing={pricing} size="lg" showBadge />
                {!isFree && (
                  <p className="text-xs text-neutral-400 mt-1">One-time payment</p>
                )}
              </div>

              {state === 'ready' ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setState('entering_email')}
                >
                  {isFree ? 'Get for Free' : 'Buy Now'} <ArrowRight size={16} />
                </Button>
              ) : (state === 'entering_email' || state === 'processing') ? (
                <form onSubmit={isFree ? handleFreeCheckout : handlePaidCheckout} className="space-y-3">
                  <Input
                    label="Your name"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="Alex Johnson"
                    autoComplete="name"
                  />
                  <Input
                    label="Email address *"
                    type="email"
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={state === 'processing'}
                  >
                    {isFree ? 'Get Free Download' : `Pay ${formatCurrency(pricing.effectivePriceCents)}`}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setState('ready')}
                    className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              ) : null}

              <div className="flex items-center gap-1.5 mt-4 text-xs text-neutral-400 justify-center">
                <Shield size={11} />
                <span>Secure · Instant delivery</span>
              </div>

              {/* Promote & Earn */}
              {affiliateEnabled && commPercent > 0 && !isFree && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <button
                    onClick={handlePromoteEarn}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-600" />
                      <span className="font-semibold text-emerald-800">
                        Earn {commPercent}% · {formatCurrency(commCents)}/sale
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Promote &amp; Earn</span>
                  </button>

                  {promoteExpanded && (
                    <div className="mt-3 space-y-2">
                      {promoteLoading ? (
                        <div className="flex items-center justify-center py-3">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                        </div>
                      ) : affiliateUrl ? (
                        <>
                          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                            <p className="truncate text-[11px] font-mono text-neutral-500">{affiliateUrl}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopyAffiliateLink}
                              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                                copied ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-neutral-800'
                              }`}
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                              {copied ? `Copied! Earn ${formatCurrency(commCents)}/sale` : 'COPY LINK'}
                            </button>
                            <button
                              onClick={handleShareAffiliateLink}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                            >
                              <Share2 size={14} />
                              Share
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-neutral-500 text-center">
                          <Link href={`/login?next=/p/${slug}`} className="font-medium underline hover:text-black">Log in</Link> to get your affiliate link.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              </div>

              <ProductReviewsCard reviews={reviews} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
