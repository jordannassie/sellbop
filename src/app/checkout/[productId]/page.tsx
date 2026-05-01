'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCheckoutSession, applyCoupon, completeCheckout } from '@/lib/services/checkout'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import { MarketingFooter } from '@/components/marketing/footer'
import type { CheckoutSession } from '@/lib/domain/entities'

export default function CheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  const router = useRouter()
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    params.then(({ productId }) => {
      createCheckoutSession(productId).then(s => {
        setSession(s)
        setLoading(false)
      })
    })
  }, [params])

  async function handleApplyCoupon() {
    if (!session || !couponCode.trim()) return
    setCouponApplying(true); setCouponError('')
    const { session: updated, error } = await applyCoupon(session, couponCode.trim())
    if (error) { setCouponError(error) } else { setSession(updated) }
    setCouponApplying(false)
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !name.trim() || !email.trim()) return
    setCompleting(true)
    try {
      const res = await fetch('/api/checkout/digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: session.productId,
          buyerName: name.trim(),
          buyerEmail: email.trim(),
          subtotalCents: session.subtotal,
          totalCents: session.total,
        }),
      })

      const data = (await res.json()) as { mode?: string; orderId?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Checkout failed.')
      }

      if (data.mode === 'live' && data.orderId) {
        router.push(`/checkout/success?orderId=${data.orderId}&productId=${session.productId}`)
        return
      }

      const order = await completeCheckout(session, email.trim(), name.trim())
      router.push(`/checkout/success?orderId=${order.id}&productId=${session.productId}`)
    } catch (err) {
      alert('Checkout failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setCompleting(false)
    }
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { product, seller } = session

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <SellBopLogo size="lg" />
          <Link href={`/p/${product.slug}`} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black">
            <ArrowLeft size={14} />Back to product
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left: form */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold text-black mb-6">Checkout</h1>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-neutral-900">Contact information</h2>
                <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required placeholder="Alex Johnson" autoComplete="name" />
                <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
              </div>

              {/* Coupon */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-neutral-900 mb-3">Have a coupon?</h2>
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="uppercase font-mono" />
                  <Button type="button" variant="secondary" size="sm" loading={couponApplying} onClick={handleApplyCoupon}>Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                {session.couponCode && !couponError && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
                    <Tag size={11} />
                    <span>Coupon <strong>{session.couponCode}</strong> applied — {formatCurrency(session.discountAmount)} off</span>
                  </div>
                )}
              </div>

              {/* Demo payment notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                <strong>Checkout note:</strong> Live Supabase orders are created when this product exists in the marketplace database. Otherwise, SellBop falls back to the demo checkout flow for local testing.
              </div>

              <Button type="submit" size="lg" loading={completing} className="w-full">
                Complete Purchase — {formatCurrency(session.total, product.currency)}
              </Button>
              <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1.5">
                <Shield size={11} />Secure checkout powered by SellBop
              </p>
            </form>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sticky top-6">
              <h2 className="text-sm font-semibold text-neutral-900 mb-4">Order Summary</h2>
              <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <GradientImageFallback productType={product.productType} iconSize="sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 capitalize">{product.productType.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatCurrency(session.subtotal)}</span>
                </div>
                {session.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({session.couponCode})</span>
                    <span>−{formatCurrency(session.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Platform fee</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span>{formatCurrency(session.total)}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-4">Sold by <span className="text-neutral-700">{seller.displayName}</span></p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
