import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEMO_PRODUCTS, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { BuyButton } from './buy-button'
import { Check, Download, Star, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = DEMO_PRODUCTS.find(p => p.slug === slug && p.status === 'published')
  if (!product) return { title: 'Not Found' }
  return {
    title: product.seoTitle ?? `${product.name} — ${DEMO_SELLER_PROFILE.displayName}`,
    description: product.seoDescription ?? product.shortDescription ?? product.description.slice(0, 160),
  }
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital Download',
  service_offer: 'Service',
  subscription: 'Subscription',
  bundle: 'Bundle',
  membership_ready: 'Membership',
}

export default async function SellPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = DEMO_PRODUCTS.find(p => p.slug === slug && p.status === 'published')
  if (!product) notFound()
  const seller = DEMO_SELLER_PROFILE

  const bullets = product.description.split('. ').filter(Boolean).slice(0, 5).map(s => s.trim())

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav */}
      <div className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-black">Selli</Link>
          <Link href={`/store/${seller.slug}`} className="text-xs text-neutral-500 hover:text-black">{seller.displayName} →</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center border border-neutral-200">
              <span className="text-7xl opacity-20">
                {product.productType === 'digital_download' ? '📄' : product.productType === 'service_offer' ? '🎯' : product.productType === 'subscription' ? '♻️' : '📦'}
              </span>
            </div>

            {/* Meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">{TYPE_LABELS[product.productType]}</span>
                {product.salesCount > 50 && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span>{product.salesCount}+ buyers</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black leading-tight mb-3">{product.name}</h1>
              <p className="text-neutral-600 text-base leading-relaxed">{product.description}</p>
            </div>

            {/* What you get */}
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 mb-3">What&apos;s included</h2>
              <ul className="space-y-2.5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check size={14} className="mt-0.5 text-green-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
                {product.fileAssetIds.length > 0 && (
                  <li className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Download size={14} className="mt-0.5 text-blue-500 flex-shrink-0" />
                    {product.fileAssetIds.length} file{product.fileAssetIds.length > 1 ? 's' : ''} delivered instantly
                  </li>
                )}
              </ul>
            </div>

            {/* Seller info */}
            <div className="border border-neutral-200 rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 flex-shrink-0">
                {seller.displayName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-black">{seller.displayName}</p>
                {seller.bio && <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{seller.bio.slice(0, 140)}…</p>}
                <Link href={`/store/${seller.slug}`} className="text-xs text-neutral-400 hover:text-black mt-1 inline-block">View all products →</Link>
              </div>
            </div>
          </div>

          {/* Buy card */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">{formatCurrency(product.price, product.currency)}</span>
                  {product.compareAtPrice && (
                    <span className="text-lg text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                  )}
                </div>
                {product.compareAtPrice && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Save {formatCurrency(product.compareAtPrice - product.price)} ({Math.round((1 - product.price / product.compareAtPrice) * 100)}% off)
                  </p>
                )}
              </div>

              <BuyButton product={{ id: product.id, name: product.name, ctaText: product.ctaText, productType: product.productType }} />

              <div className="pt-2 border-t border-neutral-100 space-y-2">
                {product.productType === 'digital_download' || product.productType === 'bundle' ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Download size={12} />
                    <span>Delivered instantly via download link</span>
                  </div>
                ) : product.productType === 'service_offer' ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Check size={12} />
                    <span>Booking link provided after payment</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Check size={12} />
                    <span>Cancel anytime · Billed monthly</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Shield size={12} />
                  <span>Secure checkout · Powered by Selli</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 text-center">
                Questions? <a href={`mailto:${product.supportEmail ?? seller.supportEmail}`} className="underline hover:text-neutral-700">Contact support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
