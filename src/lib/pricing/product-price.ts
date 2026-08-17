export interface ProductPricingFields {
  price_cents: number | null
  sale_enabled?: boolean | null
  sale_price_cents?: number | null
  sale_ends_at?: string | null
}

export interface EffectiveProductPrice {
  regularPriceCents: number
  effectivePriceCents: number
  salePriceCents: number | null
  isOnSale: boolean
  discountPercent: number | null
}

/** Determine the price a customer should see/pay right now. */
export function getEffectiveProductPrice(
  product: ProductPricingFields,
  now: Date = new Date(),
): EffectiveProductPrice {
  const regularPriceCents = product.price_cents ?? 0

  if (regularPriceCents <= 0) {
    return {
      regularPriceCents: 0,
      effectivePriceCents: 0,
      salePriceCents: null,
      isOnSale: false,
      discountPercent: null,
    }
  }

  const saleEnabled = product.sale_enabled ?? false
  const salePriceCents = product.sale_price_cents ?? null

  let isOnSale = false
  if (
    saleEnabled &&
    salePriceCents !== null &&
    salePriceCents >= 0 &&
    salePriceCents < regularPriceCents
  ) {
    const notExpired =
      !product.sale_ends_at || new Date(product.sale_ends_at).getTime() > now.getTime()
    if (notExpired) isOnSale = true
  }

  const effectivePriceCents = isOnSale ? salePriceCents! : regularPriceCents
  const discountPercent = isOnSale
    ? Math.round(((regularPriceCents - salePriceCents!) / regularPriceCents) * 100)
    : null

  return {
    regularPriceCents,
    effectivePriceCents,
    salePriceCents: isOnSale ? salePriceCents : null,
    isOnSale,
    discountPercent,
  }
}

export function validateSalePricingForSave(input: {
  price_cents: number
  sale_enabled?: boolean
  sale_price_cents?: number | null
}): string | null {
  if (input.price_cents <= 0) return null
  if (!input.sale_enabled) return null
  if (input.sale_price_cents == null || Number.isNaN(input.sale_price_cents)) {
    return 'Sale price is required when the product is on sale.'
  }
  if (input.sale_price_cents < 0) return 'Sale price cannot be negative.'
  if (input.sale_price_cents >= input.price_cents) {
    return 'Sale price must be lower than the regular price.'
  }
  return null
}

export function normalizeSaleFieldsForSave(input: {
  price_cents: number
  sale_enabled?: boolean
  sale_price_cents?: number | null
  sale_ends_at?: string | null
}) {
  if (input.price_cents <= 0) {
    return { sale_enabled: false, sale_price_cents: null, sale_ends_at: null }
  }

  if (!input.sale_enabled) {
    return {
      sale_enabled: false,
      sale_price_cents: input.sale_price_cents ?? null,
      sale_ends_at: input.sale_ends_at ?? null,
    }
  }

  return {
    sale_enabled: true,
    sale_price_cents: input.sale_price_cents ?? null,
    sale_ends_at: input.sale_ends_at ?? null,
  }
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function datetimeLocalToIso(value: string): string | null {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
