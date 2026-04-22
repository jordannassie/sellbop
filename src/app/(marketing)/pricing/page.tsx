import Link from 'next/link'
import { ArrowRight, Check, Zap } from 'lucide-react'

export const metadata = {
  title: 'Pricing — SellBop.com',
  description: '$0 platform fees during beta. No monthly fees. Only pay when you sell.',
}

// FAQ updated to reflect beta offer
const faq = [
  { q: 'Do I pay anything right now?', a: 'No. During beta, platform fees are $0 for Founder Creators. You only pay standard payment processing fees through Stripe.' },
  { q: 'What happens after beta?', a: 'After beta, Direct Sales will be 10% + $0.50 per transaction. Founder Creators who join during beta get early notice before any changes.' },
  { q: 'When does the 30% marketplace fee apply?', a: 'Only when SellBop brings a customer to you through the future discover marketplace. Not the default fee — and still $0 in beta.' },
  { q: 'Are there monthly fees?', a: 'No. SellBop never charges monthly. You only pay when you sell — and right now during beta, that platform fee is $0.' },
]

const BETA_BENEFITS = [
  '$0 platform fees during beta',
  'Early access to new features',
  'Vote on what gets built next',
  'Community access',
]

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-10">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 font-medium">Pricing</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-black">Start free during beta.</h1>
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
          Join the Founder Creators Program and pay $0 platform fees while SellBop is in beta.
        </p>
      </div>

      {/* ── Beta callout banner ─────────────────────────────────── */}
      <div className="bg-black rounded-3xl p-7 sm:p-10 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">

          {/* Left: headline */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Founder Creators Program — Beta Offer
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
              $0 platform fees right now
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
              During the beta phase, all platform fees are waived for Founder Creators. Launch your store, sell your products, and keep 100% of your revenue — minus standard payment processing only.
            </p>
          </div>

          {/* Right: benefits + CTA */}
          <div className="sm:w-64 shrink-0">
            <ul className="space-y-2 mb-5">
              {BETA_BENEFITS.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-neutral-300">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                    <Check size={9} className="text-green-400" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/login?mode=signup">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-white text-black text-sm font-bold px-5 py-3 rounded-xl hover:bg-neutral-100 transition-colors">
                Join the Beta <ArrowRight size={13} />
              </button>
            </Link>
          </div>

        </div>
      </div>

      {/* ── Pricing cards ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-4 text-center">
          Standard pricing (after beta)
        </p>
        <div className="grid lg:grid-cols-[1.4fr,0.6fr] gap-6 items-start">

          {/* Direct sales */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-[0.4em] font-medium mb-3">Direct sales</p>
              {/* Crossed-out standard fee */}
              <div className="flex items-baseline gap-3 mb-1">
                <p className="text-3xl sm:text-4xl font-bold text-neutral-300 line-through decoration-2">
                  10% + $0.50
                </p>
              </div>
              {/* Beta price */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 mb-1">
                <Zap size={12} className="text-green-600" />
                <span className="text-green-700 font-black text-lg">$0 in beta</span>
              </div>
              <p className="text-sm text-neutral-500">per direct sale · zero platform fees right now</p>
            </div>

            <p className="text-neutral-600 text-sm leading-relaxed">
              Sell downloads, services, subscriptions, and media packs. Only pay when a buyer completes a purchase — and during beta, SellBop takes nothing.
            </p>

            <ul className="space-y-2.5 text-sm text-neutral-600">
              {[
                'No monthly fee, ever',
                'Simple pricing, simple selling',
                'Built for creators selling downloads, services, and subscriptions',
                'Keep more of your revenue than complicated all-in-one tools',
                'Payment processing fees may apply separately through Stripe',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black/40 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/login?mode=signup">
              <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
                Start selling free →
              </span>
            </Link>
          </div>

          {/* Discover / marketplace */}
          <div className="bg-neutral-900 text-white rounded-3xl p-7 space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400 font-medium">Discover / marketplace</p>

            {/* Crossed-out standard fee */}
            <div>
              <p className="text-3xl font-bold text-neutral-400 line-through decoration-2 mb-1">30%</p>
              <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-lg px-2.5 py-1">
                <Zap size={10} className="text-green-400" />
                <span className="text-green-400 font-black text-base">$0 in beta</span>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Only when SellBop brings the customer to you through the future discover marketplace. Not the default fee.
            </p>
            <p className="text-xs text-neutral-500">Coming soon — discover is not live yet.</p>
          </div>

        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold text-black">Common questions</h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          {faq.map(item => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-medium text-black">{item.q}</p>
              <p className="text-sm text-neutral-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <div className="text-center pt-4">
        <p className="text-sm text-neutral-500 mb-4">
          Beta spots are limited. Join now and lock in $0 platform fees.
        </p>
        <Link href="/login?mode=signup">
          <button className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors">
            Join the Founder Creators Program <ArrowRight size={14} />
          </button>
        </Link>
      </div>

    </div>
  )
}
