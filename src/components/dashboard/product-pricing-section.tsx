'use client'

import { Input } from '@/components/ui/input'
import {
  getEffectiveProductPrice,
  validateSalePricingForSave,
} from '@/lib/pricing/product-price'
import { formatCurrency } from '@/lib/utils'

interface ProductPricingSectionProps {
  isFree: boolean
  onIsFreeChange: (value: boolean) => void
  priceDollars: string
  onPriceDollarsChange: (value: string) => void
  saleEnabled: boolean
  onSaleEnabledChange: (value: boolean) => void
  salePriceDollars: string
  onSalePriceDollarsChange: (value: string) => void
  saleEndsAt: string
  onSaleEndsAtChange: (value: string) => void
}

export function ProductPricingSection({
  isFree,
  onIsFreeChange,
  priceDollars,
  onPriceDollarsChange,
  saleEnabled,
  onSaleEnabledChange,
  salePriceDollars,
  onSalePriceDollarsChange,
  saleEndsAt,
  onSaleEndsAtChange,
}: ProductPricingSectionProps) {
  const regularCents = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100)
  const saleCents =
    salePriceDollars.trim() === '' ? null : Math.round(parseFloat(salePriceDollars) * 100)

  const saleValidationError =
    !isFree && saleEnabled
      ? validateSalePricingForSave({
          price_cents: regularCents,
          sale_enabled: true,
          sale_price_cents: saleCents,
        })
      : null

  const previewPricing = getEffectiveProductPrice({
    price_cents: regularCents,
    sale_enabled: saleEnabled && !saleValidationError,
    sale_price_cents: saleCents,
    sale_ends_at: saleEndsAt ? new Date(saleEndsAt).toISOString() : null,
  })

  function handleFreeChange(checked: boolean) {
    onIsFreeChange(checked)
    if (checked) {
      onSaleEnabledChange(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isFree}
          onChange={e => handleFreeChange(e.target.checked)}
          className="w-4 h-4 rounded border-neutral-300"
        />
        <span className="text-sm font-medium text-neutral-700">Free product</span>
      </label>

      {!isFree && (
        <>
          <Input
            label="Regular Price (USD) *"
            type="number"
            min="0.50"
            step="0.01"
            value={priceDollars}
            onChange={e => onPriceDollarsChange(e.target.value)}
            placeholder="49.00"
            required
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saleEnabled}
              onChange={e => onSaleEnabledChange(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-700">Put this product on sale</span>
          </label>

          {saleEnabled && (
            <div className="space-y-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
              <Input
                label="Sale Price (USD) *"
                type="number"
                min="0"
                step="0.01"
                value={salePriceDollars}
                onChange={e => onSalePriceDollarsChange(e.target.value)}
                placeholder="29.00"
                required
              />
              {saleValidationError && (
                <p className="text-xs text-red-600">{saleValidationError}</p>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Sale ends
                </label>
                <input
                  type="datetime-local"
                  value={saleEndsAt}
                  onChange={e => onSaleEndsAtChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Leave blank to keep this sale active until you turn it off.
                </p>
              </div>

              {!saleValidationError &&
                regularCents > 0 &&
                saleCents !== null &&
                !Number.isNaN(saleCents) &&
                previewPricing.isOnSale && (
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                      Customer sees
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-neutral-400 line-through">
                        {formatCurrency(previewPricing.regularPriceCents)}
                      </span>
                      <span className="text-lg font-bold text-black">
                        {formatCurrency(previewPricing.effectivePriceCents)}
                      </span>
                      {previewPricing.discountPercent !== null && (
                        <span className="text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                          {previewPricing.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </>
      )}

      {isFree && (
        <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2">
          Free products let customers get your product without paying — great for lead magnets.
        </p>
      )}
    </div>
  )
}
