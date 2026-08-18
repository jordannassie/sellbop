'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, Package, FileText, Calculator, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { Button } from '@/components/ui/button'
import { AFFILIATE_PLACEHOLDER_LESSONS, PRODUCT_PLACEHOLDER_CARDS } from '@/lib/school/defaults'

export function LaunchOnSellbopSection() {
  const { session } = useAuth()
  const { store } = useUserStore()
  const hasStore = !!store?.slug && store.slug !== 'demo-seller'

  const ctaHref = session
    ? hasStore
      ? '/dashboard/products/new'
      : '/start-selling'
    : '/signup'

  const ctaLabel = session
    ? hasStore
      ? 'Add Your First Product'
      : 'Create Your Free Store'
    : 'Create Your Free Store'

  const steps = [
    'Create Store',
    'Add Product',
    'Set Price',
    'Turn On Affiliates',
    'Publish',
  ]

  return (
    <section className="mb-12 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
        Take Action
      </p>
      <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">
        Stop Watching. Start Selling.
      </h2>
      <p className="text-neutral-600 text-sm sm:text-base mb-6 max-w-2xl">
        You&apos;ve learned the strategy. Now put something up for sale.
      </p>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 mb-6">
        <h3 className="text-lg font-bold text-black mb-2">Launch Your First Product on SellBop</h3>
        <p className="text-sm text-neutral-600 mb-5">
          Create your store, connect Stripe, upload your product, set your price, enable affiliates, and publish.
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-neutral-700 mb-6">
          {steps.map((step, i) => (
            <span key={step} className="inline-flex items-center gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white px-2">
                {i + 1}
              </span>
              <span>{step}</span>
              {i < steps.length - 1 && (
                <ArrowRight size={14} className="hidden sm:inline text-neutral-300 mx-1" />
              )}
            </span>
          ))}
        </div>

        <Link href={ctaHref}>
          <Button>{ctaLabel}</Button>
        </Link>
      </div>
    </section>
  )
}

const PRODUCT_ICONS = [FileText, Package, Calculator]

export function ProductVaultSection() {
  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-1">
        Don&apos;t Have a Product Yet?
      </h2>
      <p className="text-sm text-neutral-500 mb-5">
        Start with a ready-to-customize digital product.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        {PRODUCT_PLACEHOLDER_CARDS.map((card, i) => {
          const Icon = PRODUCT_ICONS[i] ?? Package
          return (
            <div
              key={card.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <Icon size={18} className="text-neutral-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">{card.title}</h3>
              <p className="text-sm text-neutral-500">{card.description}</p>
            </div>
          )
        })}
      </div>

      <Link href="/marketplace">
        <Button variant="secondary" size="sm">
          Browse Products <ArrowRight size={13} />
        </Button>
      </Link>
    </section>
  )
}

export function AffiliateSection() {
  const { session } = useAuth()
  const affiliateHref = session ? '/dashboard/resources/affiliates' : '/signup'

  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-1">
        Let Other People Sell For You
      </h2>
      <p className="text-sm text-neutral-500 mb-5 max-w-2xl">
        Create once. Let affiliates help distribute it.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {AFFILIATE_PLACEHOLDER_LESSONS.map(item => (
          <div
            key={item.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">{item.title}</h3>
            <p className="text-sm text-neutral-500">{item.description}</p>
            <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
              Coming soon
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-emerald-600" />
            <h3 className="font-bold text-black">Turn On Affiliate Share</h3>
          </div>
          <p className="text-sm text-neutral-600">
            Choose the commission. Let other SellBop creators promote your product.
          </p>
        </div>
        <Link href={affiliateHref} className="shrink-0">
          <Button variant="secondary" size="sm">
            Learn About Affiliates <ArrowRight size={13} />
          </Button>
        </Link>
      </div>
    </section>
  )
}
