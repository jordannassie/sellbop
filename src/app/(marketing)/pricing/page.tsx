import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Store,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PricingFaq } from '@/components/marketing/pricing-faq'

export const metadata: Metadata = {
  title: 'Pricing — SellBop',
  description: 'Free to start. Only pay when you sell. No monthly subscription — SellBop earns when you make sales.',
}

const DIRECT_FEATURES = [
  '$0 monthly fee',
  '$0 setup fee',
  'Unlimited product listings',
  'Digital product delivery',
  'Seller storefront',
  'Affiliate selling',
  'Sales analytics',
]

const MARKETPLACE_FEATURES = [
  'Marketplace exposure',
  'Product discovery',
  'New customer acquisition',
  'Digital product delivery',
  'Affiliate-ready products',
  'Seller analytics',
]

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#00E676' }}>
          Simple Pricing
        </p>
        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-[1.08] mb-5">
          Free to start. Only pay when you sell.
        </h1>
        <p className="text-neutral-500 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Create your store, list digital products, and start selling without a monthly subscription.
          SellBop makes money when you make money.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start Selling Free <ArrowRight size={16} /></Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="secondary">Explore Products</Button>
          </Link>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Direct Sales — primary */}
          <div className="rounded-3xl border-2 border-black bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Direct Sales</p>
            <p className="text-4xl sm:text-5xl font-black text-black leading-none">10% + $0.50</p>
            <p className="text-sm text-neutral-400 mt-1 mb-5">per transaction</p>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              For purchases made through your SellBop store, profile, or direct product links.
            </p>
            <ul className="space-y-2.5 mb-8">
              {DIRECT_FEATURES.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block">
              <Button className="w-full" size="lg">Start Selling Free</Button>
            </Link>
          </div>

          {/* Marketplace */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Marketplace Sales</p>
            <p className="text-4xl sm:text-5xl font-black text-black leading-none">30%</p>
            <p className="text-sm text-neutral-400 mt-1 mb-5">per transaction</p>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              For customers SellBop brings to your product through marketplace discovery.
            </p>
            <ul className="space-y-2.5 mb-8">
              {MARKETPLACE_FEATURES.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block">
              <Button className="w-full" size="lg" variant="secondary">List Your Product</Button>
            </Link>
          </div>
        </div>

        <p className="text-sm text-neutral-600 text-center max-w-2xl mx-auto mt-8 leading-relaxed">
          Standard payment processing fees may apply separately. Affiliate commissions are deducted when an affiliate generates the sale.
        </p>
      </section>

      {/* Affiliate pricing */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#00E676' }}>
              Affiliate Selling
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight mb-4">
              You choose what affiliates earn.
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Turn customers and creators into your sales team. Enable affiliates on any eligible product
              and choose the commission percentage you want to offer.
            </p>
          </div>

          <div className="max-w-lg mx-auto rounded-3xl border border-neutral-200 bg-white p-8 mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Example</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Product Price</span>
                <span className="font-bold text-black">$50</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Affiliate Commission</span>
                <span className="font-bold text-black">40%</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-neutral-100 pt-4">
                <span className="text-neutral-500">Affiliate Earns</span>
                <span className="font-black text-lg" style={{ color: '#00E676' }}>$20</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed pt-2">
                Seller receives the remaining proceeds after SellBop and payment processing fees.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 text-sm font-semibold text-neutral-600">
            <span className="rounded-full border border-neutral-200 bg-white px-4 py-2">Seller</span>
            <ArrowRight size={14} className="text-neutral-400" />
            <span className="rounded-full border border-neutral-200 bg-white px-4 py-2">Affiliate</span>
            <ArrowRight size={14} className="text-neutral-400" />
            <span className="rounded-full border border-neutral-200 bg-white px-4 py-2">Buyer</span>
          </div>

          <p className="text-sm text-neutral-500 text-center max-w-xl mx-auto mb-8 leading-relaxed">
            Affiliates earn when they generate a sale. Sellers only pay affiliate commissions when a sale actually happens.
          </p>

          <div className="text-center">
            <Link href="/signup">
              <Button size="lg">Start Selling With Affiliates <ArrowRight size={16} /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Three-sided marketplace */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            Everyone has a way to earn.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Store,
              title: 'Sellers',
              headline: 'Create products and grow distribution.',
              body: 'Create your own digital products, build your storefront, set your price, and allow affiliates to help sell them.',
              cta: 'Become a Seller',
              href: '/signup',
            },
            {
              icon: ShoppingBag,
              title: 'Buyers',
              headline: 'Discover useful digital products.',
              body: 'Find products, tools, templates, downloads, guides, and resources created by SellBop sellers.',
              cta: 'Explore Products',
              href: '/marketplace',
            },
            {
              icon: TrendingUp,
              title: 'Affiliates',
              headline: 'Sell products without creating your own.',
              body: 'Find products you believe in, get your unique affiliate link, promote them, and earn commission from qualifying sales.',
              cta: 'Become an Affiliate',
              href: '/marketplace',
            },
          ].map(card => (
            <div key={card.title} className="rounded-3xl border border-neutral-200 bg-white p-7 flex flex-col">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(0,230,118,0.12)' }}
              >
                <card.icon size={20} style={{ color: '#00E676' }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">{card.title}</p>
              <p className="text-lg font-bold text-black mb-3">{card.headline}</p>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6 flex-1">{card.body}</p>
              <Link href={card.href}>
                <Button variant="secondary" className="w-full">{card.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-black mb-10">
            No monthly subscription required.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Create your SellBop account', value: '$0' },
              { label: 'List digital products', value: '$0' },
              { label: 'Pay SellBop', value: 'Only when a sale happens' },
            ].map(row => (
              <div key={row.label} className="rounded-2xl border border-neutral-200 bg-white px-5 py-6">
                <p className="text-sm text-neutral-500 mb-2">{row.label}</p>
                <p className="text-xl font-black text-black">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 text-center">FAQ</p>
        <h2 className="text-2xl sm:text-3xl font-black text-black text-center mb-10">
          Common questions
        </h2>
        <PricingFaq />
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-100 bg-black text-white py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Create it. Sell it. Let everyone sell it.
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg mb-8 leading-relaxed">
            Start your SellBop store for free and only pay when you make a sale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-100">
                Start Selling Free <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="secondary" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                Explore SellBop
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
