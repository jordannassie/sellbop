import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing — SellBop',
  description: 'No monthly fees. No hidden charges. $0 SellBop platform fees during beta. Standard Stripe/payment processing fees still apply.',
}

// ─── Data ────────────────────────────────────────────────────────────────────

const BETA_BULLETS = [
  '$0 SellBop platform fees during beta',
  'Standard Stripe/payment processing fees still apply',
  'Early access to new features',
  'Community access',
  'Vote on what we build next',
]

const DIRECT_BENEFITS = [
  'No monthly fee',
  'Every product type',
  'Full store control',
]

const MARKETPLACE_BENEFITS = [
  'Built-in buyer discovery',
  'No extra marketing needed',
  'Only when SellBop sends the sale',
]

const FAQ = [
  {
    q: 'Is SellBop really $0 platform fees during beta?',
    a: 'Yes. SellBop platform fees are waived during beta for early creators in the Founder Creators Program. Standard Stripe/payment processing fees still apply separately.',
  },
  {
    q: 'What happens after beta ends?',
    a: 'Standard SellBop platform pricing will apply after beta. Current standard pricing is shown above for transparency.',
  },
  {
    q: 'Are there monthly subscription fees?',
    a: 'No. SellBop does not charge a monthly platform fee to get started.',
  },
  {
    q: 'Do I still pay payment processing fees?',
    a: 'Yes. Standard Stripe/payment processing fees still apply to every transaction. SellBop does not collect these fees — they go to the payment processor.',
  },
  {
    q: 'Does the beta apply to both direct sales and marketplace sales?',
    a: 'Yes. During beta, SellBop platform fees are waived across both direct and marketplace sales. Payment processing fees still apply.',
  },
  {
    q: 'Why join during beta?',
    a: 'You get early access, $0 SellBop platform fees, community access, and the chance to help shape what SellBop builds next.',
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main className="bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 text-center px-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-5">Pricing</p>
        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-tight mb-5">
          No hidden fees.<br className="hidden sm:block" /> No monthly charges.
        </h1>
        <p className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto mb-3">
          $0 SellBop platform fees during beta. Standard Stripe/payment processing fees still apply.
        </p>
        <p className="text-sm text-neutral-400">Standard SellBop pricing begins after beta ends.</p>
      </section>

      {/* ── Beta callout band ─────────────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto bg-black rounded-3xl p-8 sm:p-12 text-white">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              Founder Creators Program
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            $0 SellBop platform fees<br className="hidden sm:block" /> during beta
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Join early, launch your store, and help shape the platform while SellBop is in beta. Standard Stripe/payment processing fees still apply.
          </p>

          <ul className="space-y-3 mb-10">
            {BETA_BULLETS.map(b => (
              <li key={b} className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-emerald-400" />
                </div>
                {b}
              </li>
            ))}
          </ul>

          <Link href="/signup">
            <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors">
              Join the Beta <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <section className="px-4 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6 text-center">
            Standard pricing (after beta)
          </p>

          <div className="grid sm:grid-cols-2 gap-4">

            {/* Card A — Direct Sales */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Direct Sales</p>
              </div>

              {/* Crossed-out standard price */}
              <p className="text-2xl font-black text-neutral-300 line-through decoration-2 leading-none mb-2">
                10% + $0.50
              </p>

              {/* Beta price */}
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-4">
                <Zap size={12} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">$0 SellBop fees in beta</span>
              </div>

              <p className="text-sm text-neutral-500 leading-relaxed mb-5">
                When customers buy from your store, product page, or direct link.
              </p>

              <div className="space-y-2">
                {DIRECT_BENEFITS.map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check size={12} className="text-emerald-500 flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>

              <Link href="/signup" className="block mt-6">
                <button className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
                  Join the Beta <ArrowRight size={13} />
                </button>
              </Link>
            </div>

            {/* Card B — Marketplace Sales */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Marketplace Sales</p>
              </div>

              {/* Crossed-out standard price */}
              <p className="text-2xl font-black text-neutral-300 line-through decoration-2 leading-none mb-2">
                30%
              </p>

              {/* Beta price */}
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-4">
                <Zap size={12} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">$0 SellBop fees in beta</span>
              </div>

              <p className="text-sm text-neutral-500 leading-relaxed mb-5">
                When SellBop brings you the customer through marketplace discovery.
              </p>

              <div className="space-y-2">
                {MARKETPLACE_BENEFITS.map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check size={12} className="text-violet-500 flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>

              <Link href="/signup" className="block mt-6">
                <button className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
                  Join the Beta <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Standard pricing note ─────────────────────────────────────────── */}
      <section className="px-4 pt-6 pb-14 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-neutral-400">
            During beta, SellBop platform fees are waived. Standard Stripe/payment processing fees still apply. Standard SellBop pricing begins after beta ends.
          </p>
        </div>
      </section>

      {/* ── CTA row ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors">
              Join the Beta <ArrowRight size={14} />
            </button>
          </Link>
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 border border-neutral-200 text-neutral-600 text-sm font-semibold px-7 py-3.5 rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
              Start Free
            </button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-24 sm:pb-32 border-t border-neutral-100 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4 text-center">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-black text-black text-center mb-12">
            Common questions
          </h2>

          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-5"
              >
                <p className="text-sm font-bold text-black mb-2">{q}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
