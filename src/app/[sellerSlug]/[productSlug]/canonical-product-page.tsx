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

interface ProductData {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  cover_image_url: string | null
  image_url: string | null
  price_cents: number | null
  is_live: boolean
  affiliate_enabled?: boolean
  affiliate_commission_percent?: number | null
}

interface StoreData {
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
}

type State = 'loading' | 'notfound' | 'ready' | 'entering_email' | 'processing' | 'success' | 'stripe_required'

interface SuccessData {
  orderId: string
  productId: string
  productSlug: string
  email: string
}

export function CanonicalProductPage({
  sellerSlug,
  productSlug,
}: {
  sellerSlug: string
  productSlug: string
}) {
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

  const isFree = (product?.price_cents ?? 0) === 0
  const affiliateEnabled = product?.affiliate_enabled ?? false
  const commPercent = product?.affiliate_commission_percent ?? 0
  const commCents = Math.floor((product?.price_cents ?? 0) * (commPercent / 100))

  useEffect(() => {
    if (!isSupabaseConfigured()) { setState('notfound'); return }

    // Load product scoped to the seller
    fetch(`/api/public/products/${productSlug}?sellerSlug=${sellerSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setState('notfound'); return }
        setProduct(data.product)
        setStore(data.store)
        setState('ready')

        // Record affiliate click
        if (refCode) {
          fetch('/api/affiliates/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: refCode, landingUrl: window.location.href }),
          }).catch(() => {})
        }
      })
      .catch(() => setState('notfound'))
  }, [sellerSlug, productSlug, refCode])

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
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')
      setSuccess({ orderId: data.order_id, productId: product.id, productSlug: product.slug, email: buyerEmail })
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
        }),
      })
      const data = await res.json()
      if (data.stripe_required) { setState('stripe_required'); return }
      if (data.checkout_url) { window.location.href = data.checkout_url; return }
      throw new Error(data.error ?? 'Checkout unavailable.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('entering_email')
    }
  }

  async function handleDownload() {
    if (!success) return
    try {
      const res = await fetch(
        `/api/download?orderId=${success.orderId}&productId=${success.productId}&email=${encodeURIComponent(success.email)}`
      )
      const data = await res.json()
      if (!res.ok || !data.download_url) throw new Error(data.error ?? 'Download failed.')
      window.location.href = data.download_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

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
      if (res.status === 401) { window.location.href = `/login?next=/${sellerSlug}/${productSlug}`; return }
      const data = await res.json()
      if (data.relationship) {
        setAffiliateUrl(`${window.location.origin}/${sellerSlug}/${productSlug}?ref=${data.relationship.referral_code}`)
      }
    } catch { /* noop */ } finally { setPromoteLoading(false) }
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
        <Link href={`/${sellerSlug}`}><Button variant="secondary">View Store</Button></Link>
      </div>
    )
  }

  if (state === 'success' && success) {
    const showShareEarn = affiliateEnabled && commPercent > 0 && !isFree
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center"><SellBopLogo size="lg" /></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download size={24} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Your purchase is ready.</h1>
              <p className="text-neutral-500">{product?.title} is ready to download.</p>
            </div>
            <Button onClick={handleDownload} className="w-full mb-4" size="lg">
              <Download size={16} /> Download Product
            </Button>
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
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'COPY MY LINK'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePromoteEarn}
                    disabled={promoteLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {promoteLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <TrendingUp size={14} />}
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center"><SellBopLogo size="lg" /></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={24} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-black mb-2">Payments coming soon</h1>
            <p className="text-neutral-500 mb-6">This seller hasn&apos;t set up Stripe payments yet.</p>
            <Button variant="secondary" onClick={() => setState('ready')}>Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
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
            {store && (
              <Link href={`/${store.slug}`} className="flex items-center gap-2.5 mb-6 group">
                <div className="w-9 h-9 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                  {store.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={14} className="text-neutral-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800 group-hover:text-black transition-colors">{store.name}</p>
                  <p className="text-xs text-neutral-400">sellbop.com/{store.slug}</p>
                </div>
              </Link>
            )}

            {coverUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-100 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt={product?.title} className="w-full h-full object-cover" />
              </div>
            )}

            <h1 className="text-3xl font-bold text-black mb-4">{product?.title}</h1>
            {product?.description && (
              <div className="prose prose-sm max-w-none text-neutral-600">
                {product.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-3 leading-relaxed">{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* Right: buy box */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-6">
              <div className="mb-5">
                <p className="text-3xl font-bold text-black">
                  {isFree ? 'Free' : formatCurrency(product?.price_cents ?? 0)}
                </p>
                {!isFree && <p className="text-xs text-neutral-400 mt-1">One-time payment</p>}
              </div>

              {state === 'ready' ? (
                <Button size="lg" className="w-full" onClick={() => setState('entering_email')}>
                  {isFree ? 'Get for Free' : 'Buy Now'} <ArrowRight size={16} />
                </Button>
              ) : (state === 'entering_email' || state === 'processing') ? (
                <form onSubmit={isFree ? handleFreeCheckout : handlePaidCheckout} className="space-y-3">
                  <Input label="Your name" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Alex Johnson" autoComplete="name" />
                  <Input label="Email address *" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button type="submit" size="lg" className="w-full" loading={state === 'processing'}>
                    {isFree ? 'Get Free Download' : `Pay ${formatCurrency(product?.price_cents ?? 0)}`}
                  </Button>
                  <button type="button" onClick={() => setState('ready')} className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
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
                      <span className="font-semibold text-emerald-800">Earn {commPercent}% · {formatCurrency(commCents)}/sale</span>
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
                              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-neutral-800'}`}
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
                          <Link href={`/login?next=/${sellerSlug}/${productSlug}`} className="font-medium underline hover:text-black">Log in</Link> to get your affiliate link.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
