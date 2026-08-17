'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PublicHeader } from '@/components/marketing/public-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Shield, Download, ArrowRight, User, TrendingUp, Check, Copy, Share2,
  ChevronRight, Package, Zap,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/env'

// ── Types ────────────────────────────────────────────────────────────────────

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

type PageState = 'loading' | 'notfound' | 'ready' | 'entering_email' | 'processing' | 'success' | 'stripe_required'

interface SuccessData {
  orderId: string
  productId: string
  productSlug: string
  email: string
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareProductButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [url, title])

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-neutral-400 hover:text-black transition-all"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Share2 size={11} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}

// ── Creator identity row ──────────────────────────────────────────────────────

function CreatorRow({ store }: { store: StoreData }) {
  return (
    <Link href={`/${store.slug}`} className="group flex items-center gap-4 mb-6">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 ring-2 ring-white">
        {store.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={22} className="text-neutral-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 group-hover:text-black leading-none mb-1 transition-colors">
          {store.name}
        </p>
        <p className="text-xs text-neutral-400 leading-none">sellbop.com/{store.slug}</p>
      </div>
      <ChevronRight size={14} className="text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CanonicalProductPage({ sellerSlug, productSlug }: { sellerSlug: string; productSlug: string }) {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [state, setState] = useState<PageState>('loading')
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
  const coverUrl = product?.cover_image_url ?? product?.image_url

  // ── Load product ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) { setState('notfound'); return }

    fetch(`/api/public/products/${productSlug}?sellerSlug=${sellerSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setState('notfound'); return }
        setProduct(data.product)
        setStore(data.store)
        setState('ready')
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

  // ── Checkout handlers ───────────────────────────────────────────────────────
  async function handleFreeCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !buyerEmail.trim()) return
    setState('processing')
    setError('')
    try {
      const res = await fetch('/api/checkout/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: product.slug, buyerEmail: buyerEmail.trim(), buyerName: buyerName.trim() || undefined }),
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
        body: JSON.stringify({ productSlug: product.slug, buyerEmail: buyerEmail.trim(), buyerName: buyerName.trim() || undefined }),
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
      const res = await fetch(`/api/download?orderId=${success.orderId}&productId=${success.productId}&email=${encodeURIComponent(success.email)}`)
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
      try { await navigator.share({ url: affiliateUrl }); return } catch { /* cancelled */ }
    }
    handleCopyAffiliateLink()
  }

  // ── States: loading ─────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <Package size={40} className="text-neutral-200 mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">Product not found</h1>
        <p className="text-neutral-500 mb-6">This product doesn&apos;t exist or isn&apos;t available.</p>
        <Link href={`/${sellerSlug}`}>
          <Button variant="secondary">View Store</Button>
        </Link>
      </div>
    )
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (state === 'success' && success) {
    const showShareEarn = affiliateEnabled && commPercent > 0 && !isFree
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: '#ecfff6' }}>
                <Download size={26} style={{ color: '#00A854' }} />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Your purchase is ready.</h1>
              <p className="text-neutral-500 text-sm">{product?.title} — ready to download.</p>
            </div>

            <Button onClick={handleDownload} className="w-full mb-3" size="lg">
              <Download size={16} /> Download Now
            </Button>
            {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

            {showShareEarn && (
              <div className="mt-4 rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} style={{ color: '#00E676' }} />
                  <p className="text-sm font-bold text-black">
                    Earn{' '}
                    <span style={{ color: '#00E676' }}>{formatCurrency(commCents)}</span>
                    {' '}per sale
                  </p>
                </div>
                <p className="text-xs text-neutral-500 mb-4">
                  Share this product and earn {commPercent}% every time someone buys through your link.
                </p>
                {affiliateUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <p className="truncate text-[11px] font-mono text-neutral-400">{affiliateUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyAffiliateLink}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all text-white"
                        style={{ background: copied ? '#00A854' : '#000' }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'COPY MY LINK'}
                      </button>
                      <button
                        onClick={handleShareAffiliateLink}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePromoteEarn}
                    disabled={promoteLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-black border border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    {promoteLoading
                      ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                      : <TrendingUp size={14} />}
                    Get My Affiliate Link
                  </button>
                )}
              </div>
            )}

            {store && (
              <div className="mt-5 text-center">
                <Link href={`/${store.slug}`} className="text-sm text-neutral-400 hover:text-black transition-colors">
                  Visit {store.name}&apos;s store →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Stripe not configured ───────────────────────────────────────────────────
  if (state === 'stripe_required') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield size={22} className="text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-black mb-2">Payments coming soon</h1>
            <p className="text-neutral-500 text-sm mb-6">
              This seller hasn&apos;t connected their payment account yet.
            </p>
            <Button variant="secondary" onClick={() => setState('ready')}>← Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main product page ───────────────────────────────────────────────────────
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${sellerSlug}/${productSlug}`
    : `https://sellbop.com/${sellerSlug}/${productSlug}`

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">

          {/* ── Left column: product content ─────────────────────── */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Creator identity */}
            {store && <CreatorRow store={store} />}

            {/* Cover image */}
            {coverUrl && (
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-neutral-100 mb-7"
                style={{ aspectRatio: '4/3' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={product?.title ?? 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title + share */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-black tracking-tight leading-tight">
                {product?.title}
              </h1>
              <div className="flex-shrink-0 pt-1">
                <ShareProductButton url={canonicalUrl} title={product?.title ?? 'Check out this product on Sellbop'} />
              </div>
            </div>

            {/* Description */}
            {product?.description && (
              <div className="text-neutral-600 text-[15px] leading-relaxed space-y-3 mb-8">
                {product.description.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            {/* Product details */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500">
                <Package size={11} /> Digital download
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500">
                <Zap size={11} /> Instant delivery
              </span>
            </div>
          </div>

          {/* ── Right column: buy box ────────────────────────────── */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-6 space-y-3">

              {/* Buy card */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                {/* Price */}
                <div className="mb-5">
                  <p className="text-4xl font-black text-black tracking-tight">
                    {isFree ? 'Free' : formatCurrency(product?.price_cents ?? 0)}
                  </p>
                  {!isFree && (
                    <p className="text-xs text-neutral-400 mt-1">One-time payment · Instant access</p>
                  )}
                </div>

                {/* CTA */}
                {state === 'ready' && (
                  <Button size="lg" className="w-full" onClick={() => setState('entering_email')}>
                    {isFree ? 'Get for Free' : 'Buy Now'} <ArrowRight size={16} />
                  </Button>
                )}

                {(state === 'entering_email' || state === 'processing') && (
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
                    <Button type="submit" size="lg" className="w-full" loading={state === 'processing'}>
                      {isFree ? 'Get Free Download' : `Pay ${formatCurrency(product?.price_cents ?? 0)}`}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setState('ready'); setError('') }}
                      className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {/* Trust line */}
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-neutral-400">
                  <Shield size={11} />
                  <span>Secure · Instant delivery</span>
                </div>
              </div>

              {/* Affiliate card — below buy card, secondary */}
              {affiliateEnabled && commPercent > 0 && !isFree && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={15} style={{ color: '#00E676' }} />
                    <p className="text-sm font-bold text-black">
                      Earn{' '}
                      <span style={{ color: '#00E676' }}>{formatCurrency(commCents)}</span>
                      {' '}per sale
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                    Share this product and earn {commPercent}% of every sale through your link.
                  </p>

                  {!promoteExpanded ? (
                    <button
                      onClick={handlePromoteEarn}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 hover:border-neutral-400 hover:text-black transition-all"
                    >
                      <TrendingUp size={14} />
                      Promote &amp; Earn
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {promoteLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
                        </div>
                      ) : affiliateUrl ? (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                            Your Affiliate Link
                          </p>
                          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                            <p className="truncate text-[11px] font-mono text-neutral-400">{affiliateUrl}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopyAffiliateLink}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all"
                              style={{ background: copied ? '#00A854' : '#000' }}
                            >
                              {copied ? <Check size={13} /> : <Copy size={13} />}
                              {copied ? 'Copied!' : 'COPY LINK'}
                            </button>
                            <button
                              onClick={handleShareAffiliateLink}
                              className="flex items-center justify-center rounded-xl border border-neutral-200 px-3.5 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-neutral-500 text-center py-2">
                          <Link
                            href={`/login?next=/${sellerSlug}/${productSlug}`}
                            className="font-semibold underline hover:text-black transition-colors"
                          >
                            Log in
                          </Link>{' '}to get your affiliate link.
                        </p>
                      )}
                      <button
                        onClick={() => setPromoteExpanded(false)}
                        className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors pt-1"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Store link */}
              {store && (
                <Link
                  href={`/${store.slug}`}
                  className="flex items-center gap-2 px-1 text-sm text-neutral-400 hover:text-black transition-colors"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
                    {store.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
                      : <User size={10} className="text-neutral-400 m-auto" />
                    }
                  </div>
                  <span>More from {store.name}</span>
                  <ChevronRight size={13} className="ml-auto" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
