'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export function LaunchOnSellbopSection() {
  const { session, account } = useAuth()
  const hasStore = !!account?.hasStore

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
