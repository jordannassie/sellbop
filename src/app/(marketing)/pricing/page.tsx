import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing — SellBop',
  description: 'Free to start. No monthly fee. Only pay when you sell. Standard Stripe/payment processing fees apply.',
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CREATOR_PROGRAM_BULLETS = [
  'No monthly fee',
  'No credit card required to start',
  'Create your first product with AI',
  'Use your AI Launch Coach to build your offer, price, page, and launch plan',
  'Only pay when you sell',
  'Community access',
  'Vote on what we build next',
]

const DIRECT_BENEFITS = [
  'No monthly fee',
  'No credit card required to start',
  'Only pay when you sell',
  'Keep control of your audience',
  'Great for creators who bring their own buyers',
]

const MARKETPLACE_BENEFITS = [
  'SellBop helps bring new buyers',
  'Built-in marketplace discovery',
  'Only charged when SellBop sends the sale',
  'Great for creators who want more reach',
]

const FAQ = [
  {
    q: 'Is there a monthly fee to use SellBop?',
    a: 'No. SellBop does not charge a monthly platform fee. You start free, create your product, and only pay a platform fee when you make a sale.',
  },
  {
    q: 'When do I get charged?',
    a: 'Only when you make a sale. Direct sales are charged 10% + $0.50 per transaction. Marketplace sales are charged 30% per transaction when SellBop brings you the buyer.',
  },
  {
    q: 'Do I still pay payment processing fees?',
    a: 'Yes. Standard Stripe/payment processing fees still apply to every transaction. SellBop does not collect these — they go directly to the payment processor.',
  },
  {
    q: 'What is the difference between direct sales and marketplace sales?',
    a: 'Direct sales are when your own customers buy from your store link or product page. Marketplace sales are when new customers discover and buy from you through the SellBop marketplace.',
  },
  {
    q: 'Do I need a credit card to get started?',
    a: 'No. You can sign up, create your product, and set up your store for free. Payment information is only needed when you connect Stripe to start accepting purchases.',
  },
  {
    q: 'Why join the Creator Program?',
    a: 'You get an AI Launch Coach to help build your first product, a storefront, digital delivery, analytics, community access, and the ability to vote on what SellBop builds next — all with no monthly fee.',
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
          Free to start.<br className="hidden sm:block" /> Only pay when you sell.
        </h1>
        <p className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto mb-3">
          No monthly fee. No credit card required to start. SellBop platform fees are only charged when you make a sale.
        </p>
        <p className="text-sm text-neutral-400">Standard Stripe/payment processing fees still apply.</p>
      </section>

      {/* ── Creator Program callout ────────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto bg-black rounded-3xl p-8 sm:p-12 text-white">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              Creator Program
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            Join the Creator Program.<br className="hidden sm:block" />
            <span className="text-emerald-400">Start building for free.</span>
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Join the Creator Program and start building your first online business with AI. SellBop helps you turn what you know into a product you can sell — with no monthly fee and no SellBop platform fee until you make a sale.
          </p>

          <ul className="space-y-3 mb-10">
            {CREATOR_PROGRAM_BULLETS.map(b => (
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
              Join the Creator Program <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <section className="px-4 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6 text-center">
            How SellBop fees work
          </p>

          <div className="grid sm:grid-cols-2 gap-4">

            {/* Card A — Direct Sales */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Direct Sales</p>
              </div>

              <p className="text-3xl font-black text-black leading-none mb-1">
                10% + $0.50
              </p>
              <p className="text-xs text-neutral-400 mb-4">per transaction</p>

              <div className="inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 mb-4">
                <Zap size={12} className="text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-700">Only when you sell</span>
              </div>

              <p className="text-sm text-neutral-500 leading-relaxed mb-5">
                Per transaction for all sales through your profile, product page, or direct links to your customers.
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
                  Start Free <ArrowRight size={13} />
                </button>
              </Link>
            </div>

            {/* Card B — Marketplace Sales */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Marketplace Sales</p>
              </div>

              <p className="text-3xl font-black text-black leading-none mb-1">
                30%
              </p>
              <p className="text-xs text-neutral-400 mb-4">per transaction</p>

              <div className="inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 mb-4">
                <Zap size={12} className="text-violet-500" />
                <span className="text-sm font-semibold text-neutral-700">Only when SellBop sends the sale</span>
              </div>

              <p className="text-sm text-neutral-500 leading-relaxed mb-5">
                Per transaction when new customers find and buy from you through the SellBop marketplace or discovery channels.
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
                  Join the Creator Program <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing note ──────────────────────────────────────────────────── */}
      <section className="px-4 pt-6 pb-14 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-neutral-400">
            Standard Stripe/payment processing fees still apply. SellBop platform fees are charged only when you make a sale.
          </p>
        </div>
      </section>

      {/* ── CTA row ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors">
              Join the Creator Program <ArrowRight size={14} />
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
