'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Download, ArrowRight, User } from 'lucide-react'
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

export function ClientProductPage({ slug }: { slug: string }) {
  const [state, setState] = useState<State>('loading')
  const [product, setProduct] = useState<ProductData | null>(null)
  const [store, setStore] = useState<StoreData | null>(null)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [error, setError] = useState('')

  const isFree = (product?.price_cents ?? 0) === 0

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
        setState('ready')
      })
      .catch(() => setState('notfound'))
  }, [slug])

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

      setSuccess({
        orderId: data.order_id,
        productId: product.id,
        productSlug: product.slug,
        email: buyerEmail,
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
        }),
      })
      const data = await res.json()

      if (data.stripe_required) {
        setState('stripe_required')
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
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <SellBopLogo size="lg" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download size={24} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">You&apos;re all set!</h1>
            <p className="text-neutral-500 mb-6">
              {product?.title} is ready to download.
            </p>
            <Button onClick={handleDownload} className="w-full mb-4" size="lg">
              <Download size={16} /> Download Now
            </Button>
            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
            {store && (
              <Link href={`/store/${store.slug}`} className="text-sm text-neutral-500 hover:text-black transition-colors">
                Visit {store.name}&apos;s store
              </Link>
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
            <Link href={`/store/${store.slug}`} className="text-sm text-neutral-500 hover:text-black transition-colors">
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
              <Link href={`/store/${store.slug}`} className="flex items-center gap-2 mb-6 group">
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
                <span className="text-sm text-neutral-600 group-hover:text-black transition-colors">{store.name}</span>
              </Link>
            )}

            {/* Cover image */}
            {coverUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-100 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt={product?.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title & description */}
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
              {/* Price */}
              <div className="mb-5">
                <p className="text-3xl font-bold text-black">
                  {isFree ? 'Free' : formatCurrency((product?.price_cents ?? 0) / 100)}
                </p>
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
                    {isFree ? 'Get Free Download' : `Pay ${formatCurrency((product?.price_cents ?? 0) / 100)}`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
