import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/product-image'
import { RotatingWord } from '@/components/marketing/rotating-word'
import { StrategyCallSection } from '@/components/marketing/strategy-call-section'
import { Check, ArrowRight, Store, FileText, ShoppingBag, Pencil, Download, MapPin, Zap, Sparkles } from 'lucide-react'
import { DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'

export default function HomePage() {
  const featured = DEMO_PRODUCTS.filter(p => p.status === 'published').slice(0, 3)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Demo mode — try everything right now
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold text-black tracking-tight leading-[1.15] mb-6">
          Sell <RotatingWord />.<br />Keep everything.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-xl mx-auto mb-10">
          Create beautiful sell pages for digital downloads, coaching, subscriptions, and memberships. Get paid instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup"><Button size="lg">Start Free</Button></Link>
          <Link href="/demo"><Button size="lg" variant="secondary">See Demo</Button></Link>
        </div>
        <p className="text-xs text-neutral-400 mt-4">Demo accounts available · No credit card required</p>
      </section>

      {/* ── Hero photo ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl">
          <Image
            src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/Selli/image/alluring_swan_07128_High-converting_social_media_ad_image_for_afc80697-1416-4101-93bb-6d858068f98c_0.png"
            alt="Sell anything in minutes with SellBop.com"
            width={1400}
            height={700}
            className="w-full object-cover"
            priority
          />
        </div>
      </section>

      {/* ── Live product preview ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featured.map(p => (
            <Link key={p.id} href={`/p/${p.slug}`}>
              <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="aspect-video rounded-lg mb-4 overflow-hidden relative">
                  <ProductImage src={p.thumbnailUrl} alt={p.name} productType={p.productType} fill iconSize="md" />
                </div>
                <p className="text-xs text-neutral-400 mb-1 capitalize">{p.productType.replace('_', ' ')}</p>
                <p className="font-semibold text-black text-sm mb-2 group-hover:underline underline-offset-2">{p.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">{formatCurrency(p.price, p.currency)}</span>
                  {p.compareAtPrice && (
                    <span className="text-xs text-neutral-400 line-through">{formatCurrency(p.compareAtPrice)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-400 mt-4">
          <Link href="/store/alexjohnson" className="hover:text-neutral-700 underline underline-offset-2">View the full demo store →</Link>
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BENEFITS — Why creators choose SellBop (Stan-style)
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Sparkles size={11} />
              No website needed
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-4">
              Why creators choose SellBop
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Everything you need to sell online — without coding, complicated tools, or building a website from scratch.
            </p>
          </div>

          {/* Alternating benefit rows */}
          <div className="space-y-20 sm:space-y-28">

            {/* Row 1: Text left, Visual right — No coding required */}
            <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                  01 — Setup
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-black leading-tight mb-4">
                  No coding required
                </h3>
                <p className="text-neutral-500 text-base leading-relaxed mb-5">
                  Create your store, publish products, and start selling in minutes — without building a custom website or hiring a developer.
                </p>
                <p className="text-sm font-semibold text-black border-l-2 border-neutral-200 pl-3 text-neutral-700">
                  Skip the website build. Just create your product, share your page, and get paid.
                </p>
              </div>
              <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-100">
                <BenefitEditorMockup />
              </div>
            </div>

            {/* Row 2: Visual left, Text right — 1-tap checkout */}
            <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-100 order-2 md:order-1">
                <BenefitCheckoutMockup />
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                  02 — Checkout
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-black leading-tight mb-4">
                  1-tap checkout
                </h3>
                <p className="text-neutral-500 text-base leading-relaxed mb-5">
                  Every product gets its own focused sell page — built to convert on desktop and mobile without any configuration.
                </p>
                <p className="text-sm font-semibold border-l-2 border-neutral-200 pl-3 text-neutral-700">
                  Clean product pages, fast checkout, instant delivery.
                </p>
              </div>
            </div>

            {/* Row 3: Text left, Visual right — Multiple product types */}
            <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                  03 — Products
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-black leading-tight mb-4">
                  Every type of offer, one platform
                </h3>
                <p className="text-neutral-500 text-base leading-relaxed mb-5">
                  Sell digital downloads, coaching sessions, subscriptions, and bundles — all from one simple creator platform.
                </p>
                <p className="text-sm font-semibold border-l-2 border-neutral-200 pl-3 text-neutral-700">
                  One store. Every type of offer.
                </p>
              </div>
              <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-100">
                <BenefitProductTypesMockup />
              </div>
            </div>

          </div>

          {/* Supporting benefit pills */}
          <div className="mt-16 sm:mt-20 pt-10 border-t border-neutral-100 flex flex-wrap justify-center gap-2.5">
            {[
              'Marketplace discovery',
              'Dedicated product pages',
              'Visual Store Editor',
              'Launch in minutes',
              'No monthly fee',
              'Built for creators',
            ].map(pill => (
              <span key={pill} className="inline-flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2 text-sm text-neutral-600 font-medium">
                <Check size={12} className="text-neutral-400 flex-shrink-0" />
                {pill}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — Sell in three powerful ways
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Platform</p>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-4">
              Sell in three powerful ways
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              SellBop gives creators a storefront, dedicated product pages, and marketplace discovery — all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Creator Storefront */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Mini storefront preview */}
              <div className="bg-neutral-50 border-b border-neutral-100 p-5">
                <StorefrontMockup />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Store size={14} className="text-violet-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Surface 1</span>
                </div>
                <h3 className="text-lg font-black text-black mb-2">Creator Storefront</h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                  Build a clean branded store page for your audience, products, and links.
                </p>
                <Link
                  href="/store/alexjohnson"
                  className="inline-flex items-center gap-1 text-xs font-bold text-black hover:opacity-60 transition-opacity"
                >
                  View example store <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 2: Product Pages */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Mini product page preview */}
              <div className="bg-neutral-50 border-b border-neutral-100 p-5">
                <ProductPageMockup />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Surface 2</span>
                </div>
                <h3 className="text-lg font-black text-black mb-2">Product Pages</h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                  Every product gets its own focused sell page built to convert.
                </p>
                <Link
                  href="/p/notion-template-pack"
                  className="inline-flex items-center gap-1 text-xs font-bold text-black hover:opacity-60 transition-opacity"
                >
                  View example product <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 3: Marketplace */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Mini marketplace preview */}
              <div className="bg-neutral-50 border-b border-neutral-100 p-5">
                <MarketplaceMockup />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ShoppingBag size={14} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Surface 3</span>
                </div>
                <h3 className="text-lg font-black text-black mb-2">Marketplace</h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                  Get discovered by buyers browsing products across the SellBop marketplace.
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1 text-xs font-bold text-black hover:opacity-60 transition-opacity"
                >
                  Browse marketplace <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — Why creators choose SellBop
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Why SellBop</p>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-4">
              Everything you need to sell<br className="hidden sm:block" /> without the mess
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg max-w-md mx-auto">
              Powerful where it matters. Simple everywhere else.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: <Pencil size={18} />,
                bg: 'bg-violet-50',
                color: 'text-violet-600',
                title: 'Visual Store Editor',
                desc: 'Edit your storefront visually with live preview. Drag sections, arrange products, pick your theme.',
              },
              {
                icon: <Download size={18} />,
                bg: 'bg-blue-50',
                color: 'text-blue-600',
                title: 'Digital Products + Services',
                desc: 'Sell downloads, coaching sessions, subscriptions, and bundles — all product types supported.',
              },
              {
                icon: <FileText size={18} />,
                bg: 'bg-black',
                color: 'text-white',
                title: 'Dedicated Product Pages',
                desc: 'Send buyers to focused pages designed to convert. Not just a link — a real sell page.',
              },
              {
                icon: <ShoppingBag size={18} />,
                bg: 'bg-emerald-50',
                color: 'text-emerald-600',
                title: 'Marketplace Discovery',
                desc: 'Let buyers find your products beyond your own audience. More visibility, more sales.',
              },
              {
                icon: <MapPin size={18} />,
                bg: 'bg-amber-50',
                color: 'text-amber-600',
                title: 'Simple Pricing',
                desc: 'No monthly fee. Just 10% + $0.50 when you sell. Zero risk to get started.',
              },
              {
                icon: <Zap size={18} />,
                bg: 'bg-rose-50',
                color: 'text-rose-600',
                title: 'Fast Setup',
                desc: 'Launch your store and first product in minutes. No developer needed.',
              },
            ].map(f => (
              <div
                key={f.title}
                className="bg-white border border-neutral-150 rounded-2xl p-6 sm:p-7 hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                <div className={`w-9 h-9 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-black mb-2 leading-tight">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — Three surfaces. One selling system.
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-black py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-4">The Platform</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Three surfaces.<br className="hidden sm:block" /> One selling system.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              SellBop gives creators a complete selling flow — from discovery to checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Marketplace panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800">
                <MarketplaceMockupDark />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Marketplace</span>
                </div>
                <p className="text-white font-bold text-base leading-tight mb-1">Discover products</p>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  Buyers browse by category, search by topic, and find your products organically.
                </p>
              </div>
            </div>

            {/* Storefront panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden sm:scale-[1.03] sm:shadow-2xl sm:z-10 relative">
              <div className="p-5 border-b border-neutral-800">
                <StorefrontMockupDark />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Storefront</span>
                </div>
                <p className="text-white font-bold text-base leading-tight mb-1">Build your creator page</p>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  Your branded hub with your profile, products, and social links — all in one place.
                </p>
              </div>
            </div>

            {/* Product page panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800">
                <ProductPageMockupDark />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Product Page</span>
                </div>
                <p className="text-white font-bold text-base leading-tight mb-1">Convert every click</p>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  Each product has its own focused sell page with pricing, details, and checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Flow arrow */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-12 flex-wrap">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Marketplace</span>
            <ArrowRight size={14} className="text-neutral-600 flex-shrink-0" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Storefront</span>
            <ArrowRight size={14} className="text-neutral-600 flex-shrink-0" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Product Page</span>
            <ArrowRight size={14} className="text-neutral-600 flex-shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Checkout</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — Pricing
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg">
              No monthly fees. No setup fees. Only pay when you sell.
            </p>
          </div>

          <div className="bg-black rounded-3xl p-10 sm:p-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-neutral-500 mb-4">Direct Sales</p>
            <p className="text-5xl sm:text-7xl font-black text-white leading-none mb-3">
              10% <span className="text-neutral-500">+</span> $0.50
            </p>
            <p className="text-neutral-400 text-base sm:text-lg mb-10">per sale · no monthly subscription required</p>

            <div className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-10">
              {[
                ['No monthly subscription required',   'Keep control of your store'],
                ['Every product type supported',       'Marketplace discovery included'],
                ['Launch in minutes',                  'Payment processing fees may apply'],
              ].map(([l, r], i) => (
                <div key={i} className="contents">
                  <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                    <Check size={13} className="text-neutral-500 flex-shrink-0" />
                    {l}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                    <Check size={13} className="text-neutral-500 flex-shrink-0" />
                    {r}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-neutral-100 transition-colors">
                  Start Free <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="inline-flex items-center gap-2 border border-neutral-700 text-neutral-300 text-sm font-semibold px-7 py-3.5 rounded-xl hover:border-neutral-500 hover:bg-neutral-900 transition-colors">
                  View full pricing
                </button>
              </Link>
            </div>

            <p className="text-xs text-neutral-600 mt-8 border-t border-neutral-800 pt-6">
              Marketplace discovery sales (when SellBop brings the buyer): 30% per transaction.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — Strategy Call (help launching)
      ══════════════════════════════════════════════════════════════ */}
      <StrategyCallSection />

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — Final CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-28 sm:py-36 text-center bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Get started</p>
          <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-tight mb-5">
            Start selling with<br />SellBop today
          </h2>
          <p className="text-neutral-500 text-base sm:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Create your store, publish your products, and start selling in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/signup">
              <Button size="lg">Start Free</Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="secondary">View Demo</Button>
            </Link>
            <Link href="/marketplace">
              <button className="h-11 px-5 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded-xl hover:border-neutral-400 hover:bg-white transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="inline-block bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Demo accounts</p>
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-600">
                Creator: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-black font-mono">creator@sellbop.demo</code>
                {' '}<span className="text-neutral-400">/</span>{' '}
                <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-black font-mono">demo123</code>
              </p>
              <p className="text-xs text-neutral-600">
                Buyer: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-black font-mono">buyer@sellbop.demo</code>
                {' '}<span className="text-neutral-400">/</span>{' '}
                <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-black font-mono">demo123</code>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Benefit Section Mockups ───────────────────────────────────

function BenefitEditorMockup() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-1.5">
          {['bg-red-300', 'bg-amber-300', 'bg-green-300'].map(c => (
            <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
          ))}
        </div>
        <div className="w-28 h-2 bg-neutral-200 rounded-full" />
        <div className="w-16 h-5 bg-black rounded-lg flex items-center justify-center">
          <div className="w-9 h-1.5 bg-white/60 rounded-full" />
        </div>
      </div>
      {/* Editor: sidebar + preview */}
      <div className="flex min-h-[160px]">
        {/* Sidebar */}
        <div className="w-28 border-r border-neutral-100 p-3 space-y-3 flex-shrink-0">
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-neutral-300 rounded-full" />
            <div className="w-3/4 h-1.5 bg-neutral-200 rounded-full" />
          </div>
          <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-2 space-y-1.5">
            <div className="w-full h-5 bg-white border border-neutral-200 rounded" />
            <div className="w-full h-5 bg-white border border-neutral-200 rounded" />
            <div className="w-2/3 h-1.5 bg-neutral-200 rounded-full mt-1" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['bg-black', 'bg-violet-400', 'bg-blue-400', 'bg-emerald-400'].map((c, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-black' : ''}`} />
            ))}
          </div>
        </div>
        {/* Live preview */}
        <div className="flex-1 p-3 bg-neutral-50/50">
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-100">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white text-[9px] font-black">A</div>
              <div>
                <div className="w-14 h-1.5 bg-black rounded-full" />
                <div className="w-20 h-1 bg-neutral-300 rounded-full mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {(['bg-violet-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100'] as const).map((c, i) => (
                <div key={i} className="bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden">
                  <div className={`h-7 ${c}`} />
                  <div className="px-1.5 py-1">
                    <div className="w-full h-1 bg-neutral-300 rounded-full" />
                    <div className="w-6 h-1 bg-black rounded-full mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BenefitCheckoutMockup() {
  return (
    <div className="max-w-[260px] mx-auto bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Product hero image area */}
      <div className="h-28 bg-gradient-to-br from-blue-50 via-violet-50 to-blue-100 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-white border border-white/80 shadow-md flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-violet-500" />
        </div>
      </div>
      {/* Product content */}
      <div className="p-5">
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mb-2.5" />
        <div className="w-full h-2.5 bg-black rounded-full mb-1.5" />
        <div className="w-3/4 h-2.5 bg-neutral-200 rounded-full mb-4" />
        <div className="flex items-baseline gap-2 mb-5">
          <div className="w-12 h-4 bg-black rounded-md" />
          <div className="w-8 h-2.5 bg-neutral-200 rounded-full line-through" />
        </div>
        {/* CTA button */}
        <div className="w-full h-11 bg-black rounded-2xl flex items-center justify-center">
          <div className="w-32 h-2 bg-white/50 rounded-full" />
        </div>
        {/* Trust row */}
        <div className="flex items-center justify-center gap-4 mt-3.5">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-neutral-100 border border-neutral-200" />
              <div className="w-14 h-1.5 bg-neutral-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BenefitProductTypesMockup() {
  const types = [
    { label: 'Digital Download', bg: 'bg-blue-50', bar: 'bg-blue-400', dot: 'bg-blue-500', price: '$29' },
    { label: 'Coaching',         bg: 'bg-violet-50', bar: 'bg-violet-400', dot: 'bg-violet-500', price: '$500' },
    { label: 'Membership',       bg: 'bg-emerald-50', bar: 'bg-emerald-400', dot: 'bg-emerald-500', price: '$19/mo' },
    { label: 'Bundle',           bg: 'bg-amber-50', bar: 'bg-amber-400', dot: 'bg-amber-500', price: '$97' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map(t => (
        <div key={t.label} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className={`${t.bg} h-16 flex items-center justify-center`}>
            <div className={`w-8 h-8 rounded-xl ${t.bar} flex items-center justify-center`}>
              <div className="w-4 h-4 rounded-md bg-white/50" />
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 leading-none">{t.label}</p>
            </div>
            <p className="text-base font-black text-black leading-none">{t.price}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Mini Mockup Components ────────────────────────────────────

function StorefrontMockup() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden text-left shadow-sm">
      {/* Header strip */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-black">A</div>
        <div>
          <div className="w-16 h-2 bg-neutral-900 rounded-full" />
          <div className="w-24 h-1.5 bg-neutral-200 rounded-full mt-1" />
        </div>
      </div>
      {/* Socials */}
      <div className="flex gap-1.5 px-3 py-2">
        {['Twitter', 'Web'].map(s => (
          <div key={s} className="h-5 px-2 rounded-full bg-neutral-100 border border-neutral-200 flex items-center">
            <div className="w-8 h-1.5 bg-neutral-300 rounded-full" />
          </div>
        ))}
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden">
            <div className="h-8 bg-neutral-200" />
            <div className="p-1.5">
              <div className="w-full h-1.5 bg-neutral-300 rounded-full" />
              <div className="w-8 h-1.5 bg-neutral-900 rounded-full mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductPageMockup() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
      <div className="flex gap-2.5 p-3">
        {/* Left: image */}
        <div className="w-20 flex-shrink-0 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden">
          <div className="h-16 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        </div>
        {/* Right: content */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="w-8 h-1.5 bg-neutral-300 rounded-full mb-1.5" />
          <div className="w-full h-2 bg-neutral-900 rounded-full mb-1" />
          <div className="w-3/4 h-2 bg-neutral-900 rounded-full mb-3" />
          <div className="w-10 h-2.5 bg-neutral-700 rounded-full mb-3" />
          <div className="w-full h-6 bg-neutral-900 rounded-lg flex items-center justify-center">
            <div className="w-16 h-1.5 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
      {/* Trust strip */}
      <div className="border-t border-neutral-100 px-3 py-2 flex gap-3">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
            <div className="w-14 h-1.5 bg-neutral-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketplaceMockup() {
  const categories = ['Templates', 'Courses', 'Coaching']
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-neutral-100">
        <div className="h-5 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center px-2 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-neutral-300" />
          <div className="w-24 h-1.5 bg-neutral-200 rounded-full" />
        </div>
      </div>
      {/* Categories */}
      <div className="flex gap-1.5 px-3 py-2">
        {categories.map((c, i) => (
          <div key={c} className={`h-5 px-2 rounded-full text-[8px] font-bold flex items-center border ${i === 0 ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
            {c}
          </div>
        ))}
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden">
            <div className={`h-6 ${i % 3 === 0 ? 'bg-violet-100' : i % 3 === 1 ? 'bg-blue-100' : 'bg-emerald-100'}`} />
            <div className="p-1">
              <div className="w-full h-1 bg-neutral-200 rounded-full" />
              <div className="w-5 h-1 bg-neutral-300 rounded-full mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dark variants for Section 3 ───────────────────────────────

function StorefrontMockupDark() {
  return (
    <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-700">
        <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-black">A</div>
        <div>
          <div className="w-16 h-1.5 bg-white rounded-full" />
          <div className="w-20 h-1 bg-neutral-600 rounded-full mt-1" />
        </div>
      </div>
      <div className="flex gap-1 px-3 py-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-4 px-2 rounded-full bg-neutral-700 border border-neutral-600 flex items-center">
            <div className="w-6 h-1 bg-neutral-500 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-neutral-700 rounded-lg overflow-hidden border border-neutral-600">
            <div className="h-7 bg-neutral-600" />
            <div className="p-1.5">
              <div className="w-full h-1 bg-neutral-500 rounded-full" />
              <div className="w-6 h-1 bg-violet-400 rounded-full mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductPageMockupDark() {
  return (
    <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="flex gap-2 p-3">
        <div className="w-16 flex-shrink-0 rounded-lg bg-neutral-700 border border-neutral-600 overflow-hidden">
          <div className="h-12 bg-gradient-to-br from-blue-900/50 to-neutral-700" />
        </div>
        <div className="flex-1 py-0.5">
          <div className="w-6 h-1 bg-neutral-600 rounded-full mb-1.5" />
          <div className="w-full h-1.5 bg-white rounded-full mb-1" />
          <div className="w-2/3 h-1.5 bg-neutral-400 rounded-full mb-2.5" />
          <div className="w-8 h-2 bg-neutral-500 rounded-full mb-2" />
          <div className="w-full h-5 bg-blue-500 rounded-lg" />
        </div>
      </div>
      <div className="border-t border-neutral-700 px-3 py-1.5 flex gap-2">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-neutral-600" />
            <div className="w-12 h-1 bg-neutral-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketplaceMockupDark() {
  return (
    <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-700">
        <div className="h-4 bg-neutral-700 rounded-lg border border-neutral-600 flex items-center px-2 gap-1">
          <div className="w-2 h-2 rounded-full border border-neutral-500" />
          <div className="w-16 h-1 bg-neutral-600 rounded-full" />
        </div>
      </div>
      <div className="flex gap-1 px-3 py-1.5">
        {['All', 'Templates', 'Courses'].map((c, i) => (
          <div key={c} className={`h-4 px-2 rounded-full text-[7px] font-bold flex items-center border ${i === 0 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-neutral-700 border-neutral-600 text-neutral-500'}`}>
            {c}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-neutral-700 rounded-lg border border-neutral-600 overflow-hidden">
            <div className={`h-5 ${i % 3 === 0 ? 'bg-violet-900/50' : i % 3 === 1 ? 'bg-blue-900/50' : 'bg-emerald-900/50'}`} />
            <div className="p-1">
              <div className="w-full h-1 bg-neutral-600 rounded-full" />
              <div className="w-4 h-1 bg-neutral-500 rounded-full mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
