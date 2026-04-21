'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { demoProductRepo, demoOrderRepo, demoCustomerRepo, demoAnalyticsRepo, demoEmailRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import {
  ArrowLeft, Shield, Truck, CheckCircle2,
  Loader2, AlertCircle, Shirt, Zap, ChevronDown,
} from 'lucide-react'
import type { Product, ProductVariant, PrintifyShippingAddress } from '@/lib/domain/entities'

// ── Helpers ───────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', required = false, half = false,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; half?: boolean
}) {
  return (
    <div className={half ? 'flex-1 min-w-0' : 'w-full'}>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-colors bg-white"
      />
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
      {children}
    </div>
  )
}

// ── Shipping quote state ──────────────────────────────────────
type ShippingState =
  | { status: 'idle' }
  | { status: 'calculating' }
  | { status: 'ready'; cents: number; carrier: string; methodId: number; demo: boolean }
  | { status: 'error'; message: string }

// ── Main page ─────────────────────────────────────────────────
export default function MerchCheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [product,         setProduct]         = useState<Product | null>(null)
  const [variant,         setVariant]         = useState<ProductVariant | null>(null)
  const [qty,             setQty]             = useState(1)
  const [loading,         setLoading]         = useState(true)
  const [completing,      setCompleting]      = useState(false)
  const [shippingState,   setShippingState]   = useState<ShippingState>({ status: 'idle' })

  // Contact fields
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Shipping address fields
  const [addr1,    setAddr1]    = useState('')
  const [addr2,    setAddr2]    = useState('')
  const [city,     setCity]     = useState('')
  const [state,    setState]    = useState('')
  const [postal,   setPostal]   = useState('')
  const [country,  setCountry]  = useState('US')

  // Load product + resolve variant from URL params
  useEffect(() => {
    params.then(({ productId }) => {
      const variantId = searchParams.get('variant')
      const qtyParam  = parseInt(searchParams.get('qty') ?? '1', 10)
      setQty(isNaN(qtyParam) || qtyParam < 1 ? 1 : Math.min(qtyParam, 10))

      demoProductRepo.findById(productId).then(p => {
        if (!p || p.source !== 'printify') {
          setLoading(false)
          return
        }
        setProduct(p)
        if (variantId) {
          const v = p.variants.find(v => v.id === variantId) ?? null
          setVariant(v)
        }
        setLoading(false)
      })
    })
  }, [params, searchParams])

  // ── Pricing ────────────────────────────────────────────────
  const unitPriceCents   = Math.round((variant?.price ?? product?.price ?? 0) * 100)
  const subtotalCents    = unitPriceCents * qty
  const shippingCents    = shippingState.status === 'ready' ? shippingState.cents : 0
  const totalCents       = subtotalCents + shippingCents

  // ── Address complete check ─────────────────────────────────
  const addressComplete = addr1.trim() && city.trim() && state.trim() && postal.trim() && country.trim()

  // ── Build PrintifyAddress ─────────────────────────────────
  function buildAddress(): PrintifyShippingAddress {
    const nameParts = name.trim().split(' ')
    return {
      firstName: nameParts[0] ?? '',
      lastName:  (nameParts.slice(1).join(' ') || nameParts[0]) ?? '',
      address1:  addr1.trim(),
      address2:  addr2.trim() || undefined,
      city:      city.trim(),
      region:    state.trim(),
      zip:       postal.trim(),
      country:   country.trim(),
      phone:     phone.trim() || undefined,
    }
  }

  // ── Calculate shipping ─────────────────────────────────────
  const calculateShipping = useCallback(async () => {
    if (!product || !variant || !addressComplete) return
    setShippingState({ status: 'calculating' })

    try {
      const res = await fetch('/api/printify/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printifyProductId: product.printifyProductId,
          printifyVariantId: variant.printifyVariantId,
          quantity: qty,
          address: {
            first_name: name.split(' ')[0] || 'Customer',
            last_name:  name.split(' ').slice(1).join(' ') || 'Customer',
            email:      email || 'demo@sellbop.com',
            phone:      phone || undefined,
            country:    country,
            region:     state,
            address1:   addr1,
            address2:   addr2 || undefined,
            city:       city,
            zip:        postal,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Shipping calculation failed')

      setShippingState({
        status:   'ready',
        cents:    data.shippingCents,
        carrier:  data.carrier,
        methodId: data.methodId,
        demo:     data.demo ?? false,
      })
    } catch (err) {
      setShippingState({
        status:  'error',
        message: err instanceof Error ? err.message : 'Could not calculate shipping',
      })
    }
  }, [product, variant, addressComplete, qty, name, email, phone, country, state, addr1, addr2, city, postal])

  // ── Complete checkout ──────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !variant || shippingState.status !== 'ready') return
    setCompleting(true)

    try {
      const address = buildAddress()
      const sellerId = DEMO_SELLER_PROFILE.id

      // 1. Create/update customer
      let customer = await demoCustomerRepo.findByEmail(sellerId, email.trim())
      if (!customer) {
        customer = await demoCustomerRepo.create({
          sellerId, email: email.trim(), name: name.trim(),
          totalSpend: totalCents / 100, purchaseCount: 1,
          lastPurchaseAt: new Date().toISOString(), orderIds: [],
        })
      } else {
        await demoCustomerRepo.update(customer.id, {
          totalSpend: customer.totalSpend + totalCents / 100,
          purchaseCount: customer.purchaseCount + 1,
          lastPurchaseAt: new Date().toISOString(),
        })
      }

      // 2. Create SellBop order
      const order = await demoOrderRepo.create({
        sellerId,
        productId:   product.id,
        productName: product.name,
        productType: product.productType,
        customerId:  customer.id,
        customerEmail: email.trim(),
        customerName:  name.trim(),
        amount:      totalCents / 100,
        currency:    product.currency,
        status:      'completed',
        paymentStatus: 'paid',
        refundStatus:  'paid',
        refundedAt:    null,
        refundReason:  null,
        accessStatus:  'active',
        subscriptionId: null,
        couponId:    null,
        couponCode:  null,
        discountAmount: 0,
        stripePaymentIntentId: null,
        stripeSessionId: null,
        receiptSent: true,
        internalNotes: null,
        fulfillmentProvider: 'printify',
        fulfillmentStatus:   'pending',
        printifyOrderId:     null,
        shippingAddress:     address,
        orderQuantity:       qty,
        selectedVariantId:   variant.id,
      })

      // 3. Try to send to Printify
      let printifyOrderId: string | null = null
      try {
        const poRes = await fetch('/api/printify/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: product.printifyShopId,
            payload: {
              label:    `SellBop Order ${order.id}`,
              line_items: [{
                product_id: product.printifyProductId!,
                variant_id: variant.printifyVariantId!,
                quantity:   qty,
              }],
              shipping_method: shippingState.status === 'ready' ? shippingState.methodId : 1,
              send_shipping_notification: true,
              address_to: {
                first_name: address.firstName,
                last_name:  address.lastName,
                email:      email.trim(),
                phone:      address.phone,
                country:    address.country,
                region:     address.region,
                address1:   address.address1,
                address2:   address.address2,
                city:       address.city,
                zip:        address.zip,
              },
            },
          }),
        })
        if (poRes.ok) {
          const poData = await poRes.json()
          printifyOrderId = poData.printifyOrderId ?? null
          await demoOrderRepo.update(order.id, {
            printifyOrderId,
            fulfillmentStatus: 'sent_to_printify',
          })
        }
      } catch { /* silently continue — order is still saved locally */ }

      // 4. Analytics + email
      await demoAnalyticsRepo.create({
        sellerId, productId: product.id, eventType: 'purchase_completed',
        buyerEmail: email.trim(), source: 'direct',
        metadata: { amount: totalCents / 100, orderId: order.id, type: 'merch' },
      })
      await demoEmailRepo.create({
        sellerId, type: 'receipt', toEmail: email.trim(),
        subject: `Your order — ${product.name}`,
        orderId: order.id, status: 'simulated',
      })

      router.push(`/checkout/success?orderId=${order.id}&productId=${product.id}`)
    } catch (err) {
      alert('Checkout failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setCompleting(false)
    }
  }

  // ── Loading / error states ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product || product.source !== 'printify') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-neutral-500 mb-4">Product not found or not a merch item.</p>
        <Link href="/" className="text-sm font-semibold text-black underline">Go home</Link>
      </div>
    )
  }

  const canCheckout = (
    name.trim() && email.trim() && addressComplete && shippingState.status === 'ready'
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <SellBopLogo size="lg" />
          <Link href={`/p/${product.slug}`} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={14} /> Back to product
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── LEFT: forms ─────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <h1 className="text-2xl font-bold text-black">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Contact */}
              <SectionCard title="Contact information">
                <Field label="Full Name" value={name} onChange={setName} placeholder="Alex Johnson" required />
                <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
                <Field label="Phone (optional)" value={phone} onChange={setPhone} type="tel" placeholder="+1 555 000 0000" />
              </SectionCard>

              {/* Shipping address */}
              <SectionCard title="Shipping address">
                <div className="relative">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Country<span className="text-red-400 ml-0.5">*</span></label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 appearance-none bg-white"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="JP">Japan</option>
                    <option value="NZ">New Zealand</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-[34px] text-neutral-400 pointer-events-none" />
                </div>
                <Field label="Address line 1" value={addr1} onChange={setAddr1} placeholder="123 Main Street" required />
                <Field label="Address line 2 (optional)" value={addr2} onChange={setAddr2} placeholder="Apt 4B" />
                <div className="flex gap-3">
                  <Field label="City" value={city} onChange={setCity} placeholder="New York" required half />
                  <Field label="State / Province" value={state} onChange={setState} placeholder="NY" required half />
                </div>
                <Field label="Postal / ZIP code" value={postal} onChange={setPostal} placeholder="10001" required />
              </SectionCard>

              {/* Shipping quote */}
              <SectionCard title="Shipping">
                {shippingState.status === 'idle' && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-500">Fill in your shipping address, then calculate your shipping rate.</p>
                    <button
                      type="button"
                      onClick={calculateShipping}
                      disabled={!addressComplete || !variant}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        addressComplete && variant
                          ? 'border-black text-black hover:bg-black hover:text-white'
                          : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      Calculate Shipping
                    </button>
                    {!variant && <p className="text-xs text-amber-600 text-center">← Go back and select a size first</p>}
                  </div>
                )}

                {shippingState.status === 'calculating' && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600 py-1">
                    <Loader2 size={14} className="animate-spin" />
                    Calculating shipping rate…
                  </div>
                )}

                {shippingState.status === 'ready' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">{shippingState.carrier}</p>
                        <p className="text-xs text-emerald-600">
                          {formatCurrency(shippingState.cents / 100, 'USD')}
                          {shippingState.demo && ' · Demo estimate'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShippingState({ status: 'idle' })}
                      className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                    >
                      Recalculate
                    </button>
                  </div>
                )}

                {shippingState.status === 'error' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{shippingState.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={calculateShipping}
                      className="text-xs text-neutral-600 hover:text-black underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* Demo notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                <strong>Demo mode:</strong> No real payment will be processed. Click &quot;Complete Purchase&quot; to simulate a successful checkout and Printify order.
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canCheckout || completing}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all ${
                  canCheckout && !completing
                    ? 'bg-black hover:bg-neutral-800 active:scale-[0.99]'
                    : 'bg-neutral-300 cursor-not-allowed'
                }`}
              >
                {completing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Placing order…
                  </span>
                ) : (
                  `Complete Purchase — ${formatCurrency(totalCents / 100, product.currency)}`
                )}
              </button>

              {!canCheckout && shippingState.status !== 'ready' && (
                <p className="text-xs text-neutral-400 text-center">Calculate your shipping rate to continue</p>
              )}

              <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1.5">
                <Shield size={11} /> Secure checkout powered by SellBop
              </p>
            </form>
          </div>

          {/* ── RIGHT: order summary ─────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 sticky top-6 space-y-4">
              <h2 className="text-sm font-bold text-neutral-900">Order Summary</h2>

              {/* Product */}
              <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-100">
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <Shirt size={22} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 leading-snug">{product.name}</p>
                  {variant && (
                    <p className="text-xs text-neutral-500 mt-0.5">{variant.name}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-500 border border-violet-100">
                      <Zap size={7} /> Printify
                    </span>
                    <span className="text-[9px] text-neutral-400">Qty: {qty}</span>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal ({qty} item{qty > 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatCurrency(subtotalCents / 100)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Truck size={11} /> Shipping
                  </span>
                  <span className="font-medium">
                    {shippingState.status === 'ready'
                      ? formatCurrency(shippingState.cents / 100)
                      : shippingState.status === 'calculating'
                        ? '…'
                        : '—'}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span>
                    {shippingState.status === 'ready'
                      ? formatCurrency(totalCents / 100)
                      : formatCurrency(subtotalCents / 100) + ' + shipping'}
                  </span>
                </div>
              </div>

              {/* Fulfillment note */}
              <p className="text-[10px] text-neutral-400 flex items-center gap-1 pt-1 border-t border-neutral-100">
                <Shirt size={9} /> Printed on demand · Fulfilled by Printify
              </p>

              <p className="text-xs text-neutral-400">
                Sold by <span className="text-neutral-700">{DEMO_SELLER_PROFILE.displayName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
