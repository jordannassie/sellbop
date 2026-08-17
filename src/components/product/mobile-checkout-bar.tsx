'use client'

import { useEffect } from 'react'
import { ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductPriceDisplay } from '@/components/ui/product-price-display'
import { formatCurrency } from '@/lib/utils'
import type { EffectiveProductPrice } from '@/lib/pricing/product-price'

interface MobileStickyCheckoutBarProps {
  pricing: EffectiveProductPrice
  isFree: boolean
  onBuyClick: () => void
}

export function MobileStickyCheckoutBar({
  pricing,
  isFree,
  onBuyClick,
}: MobileStickyCheckoutBarProps) {
  const buyLabel = isFree ? 'Get Now' : 'Buy Now'
  const priceLabel = isFree
    ? 'Free product'
    : pricing.isOnSale
      ? `Sale price ${formatCurrency(pricing.effectivePriceCents)}, was ${formatCurrency(pricing.regularPriceCents)}, ${pricing.discountPercent ?? 0} percent off`
      : `Price ${formatCurrency(pricing.regularPriceCents)}`

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[3.5rem]">
        <div className="min-w-0 flex-1" aria-label={priceLabel}>
          <ProductPriceDisplay pricing={pricing} size="sm" showBadge className="gap-1.5" />
        </div>
        <Button
          size="lg"
          className="flex-shrink-0 px-5"
          onClick={onBuyClick}
          aria-label={isFree ? 'Get this product for free' : `Buy now for ${formatCurrency(pricing.effectivePriceCents)}`}
        >
          {buyLabel} <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}

interface MobileCheckoutSheetProps {
  isFree: boolean
  pricing: EffectiveProductPrice
  state: 'entering_email' | 'processing'
  buyerName: string
  buyerEmail: string
  error: string
  onBuyerNameChange: (value: string) => void
  onBuyerEmailChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function MobileCheckoutSheet({
  isFree,
  pricing,
  state,
  buyerName,
  buyerEmail,
  error,
  onBuyerNameChange,
  onBuyerEmailChange,
  onSubmit,
  onCancel,
}: MobileCheckoutSheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-checkout-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close checkout"
        onClick={onCancel}
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white px-5 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
        <h2 id="mobile-checkout-title" className="text-lg font-bold text-black mb-1">
          {isFree ? 'Get your free download' : 'Complete your purchase'}
        </h2>
        <p className="text-xs text-neutral-400 mb-4">
          {isFree ? 'Enter your email to receive instant access.' : 'One-time payment · Instant access'}
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Your name"
            value={buyerName}
            onChange={e => onBuyerNameChange(e.target.value)}
            placeholder="Alex Johnson"
            autoComplete="name"
          />
          <Input
            label="Email address *"
            type="email"
            value={buyerEmail}
            onChange={e => onBuyerEmailChange(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={state === 'processing'}>
            {isFree ? 'Get Free Download' : `Pay ${formatCurrency(pricing.effectivePriceCents)}`}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1"
          >
            Cancel
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-neutral-400">
          <Shield size={11} aria-hidden />
          <span>Secure · Instant delivery</span>
        </div>
      </div>
    </div>
  )
}
