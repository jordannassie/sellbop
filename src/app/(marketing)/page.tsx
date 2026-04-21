import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/product-image'
import { RotatingWord } from '@/components/marketing/rotating-word'
import { StrategyCallSection } from '@/components/marketing/strategy-call-section'
import { Check, ArrowRight, FileText, ShoppingBag, Pencil, Download, MapPin, Zap, Sparkles } from 'lucide-react'
import { DEMO_PRODUCTS, DEMO_STOREFRONT, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
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
                <p className="font-semibold text-black text-sm mb-3 group-hover:underline underline-offset-2">{p.name}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-black">{formatCurrency(p.price, p.currency)}</span>
                  {p.compareAtPrice && (
                    <span className="text-xs text-neutral-400 line-through">{formatCurrency(p.compareAtPrice)}</span>
                  )}
                </div>
                {/* Creator chip */}
                <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                  <div
                    className="rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black"
                    style={{ width: 26, height: 26, fontSize: 10, backgroundColor: DEMO_STOREFRONT.themeColor }}
                  >
                    {DEMO_SELLER_PROFILE.displayName.charAt(0)}
                  </div>
                  <span className="text-xs text-neutral-500 truncate">{DEMO_SELLER_PROFILE.displayName}</span>
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
                className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 hover:border-neutral-300 hover:shadow-sm transition-all"
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
          SECTION 4 — Pricing
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">

          {/* Headline — benefit-first */}
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-5">Pricing</p>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-4">
            No hidden fees.<br className="hidden sm:block" /> No monthly charges.
          </h2>
          <p className="text-neutral-500 text-base sm:text-lg mb-12">
            Start free and only pay when you sell.
          </p>

          {/* Two pricing cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">

            {/* Card 1: Direct */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Direct Sales</p>
              </div>
              <p className="text-4xl font-black text-black leading-none mb-1">
                10%<span className="text-2xl text-neutral-400"> + $0.50</span>
              </p>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                When customers buy from your store, product page, or direct link.
              </p>
              <div className="mt-5 space-y-2">
                {['No monthly fee', 'Every product type', 'Full store control'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check size={12} className="text-emerald-500 flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Marketplace */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Marketplace Sales</p>
              </div>
              <p className="text-4xl font-black text-black leading-none mb-1">30%</p>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                When SellBop brings you the customer through marketplace discovery.
              </p>
              <div className="mt-5 space-y-2">
                {['Built-in buyer discovery', 'No extra marketing needed', 'Only when SellBop sends the sale'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check size={12} className="text-violet-500 flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fairness note */}
          <p className="text-xs text-neutral-400 mb-10">
            Marketplace pricing only applies when SellBop brings you the buyer. Your direct sales always stay at 10% + $0.50.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors">
                Start Free <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="inline-flex items-center gap-2 border border-neutral-200 text-neutral-600 text-sm font-semibold px-7 py-3.5 rounded-xl hover:border-neutral-400 hover:bg-white transition-colors">
                View full pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          INTEGRATIONS — Connect the platforms you already sell on
      ══════════════════════════════════════════════════════════════ */}
      <PlatformIntegrationsSection />

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

// ── Platform Integrations Section ─────────────────────────────────────────────

function PlatformIntegrationsSection() {
  const platforms = [
    { name: 'Shopify',  desc: 'Show products, checkout on Shopify',      badge: 'Connected',   iconBg: 'bg-[#96BF48]', initial: 'S' },
    { name: 'Printify', desc: 'Sync merch, fulfill through Printify',    badge: 'Connected',   iconBg: 'bg-[#00172B]', initial: 'P' },
    { name: 'Amazon',   desc: 'Feature products, buy on Amazon',         badge: 'Coming soon', iconBg: 'bg-[#FF9900]', initial: 'A' },
    { name: 'Etsy',     desc: 'Showcase listings, checkout on Etsy',     badge: 'Coming soon', iconBg: 'bg-[#F45800]', initial: 'E' },
    { name: 'eBay',     desc: 'Connect listings and buying flows',       badge: 'Coming soon', iconBg: 'bg-[#E53238]', initial: 'e' },
    { name: 'Thousands More', desc: 'Via direct integrations — connect any platform you already sell on', badge: 'Soon', iconBg: 'bg-neutral-700', initial: '+' },
  ]

  return (
    <section className="border-t border-neutral-100 py-16 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Compact header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-3">Integrations</p>
          <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight mb-3">
            Connect the platforms you already sell on
          </h2>
          <p className="text-neutral-500 text-sm sm:text-base max-w-md mx-auto">
            Bring your products into SellBop and sell from one central hub.
          </p>
        </div>

        {/* Hub + spoke layout */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-0">

          {/* LEFT — SellBop hub */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0 sm:pt-6 sm:w-40">
            {/* Big rounded square icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-3xl tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>S</span>
              </div>
              {/* Live dot */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full" />
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-black">SellBop</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Your selling hub</p>
            </div>
          </div>

          {/* CENTER — connecting bridge (desktop only) */}
          <div className="hidden sm:flex flex-col items-center justify-center w-16 flex-shrink-0" style={{ marginTop: 38 }}>
            {/* Horizontal dashed line + dot */}
            <div className="flex items-center w-full">
              <div className="flex-1 border-t-2 border-dashed border-neutral-200" />
              <div className="w-2 h-2 rounded-full bg-neutral-300 flex-shrink-0" />
            </div>
          </div>

          {/* Mobile connector */}
          <div className="flex sm:hidden flex-col items-center gap-1">
            <div className="w-px h-6 border-l-2 border-dashed border-neutral-200" />
            <div className="w-2 h-2 rounded-full bg-neutral-300" />
          </div>

          {/* RIGHT — platform rows */}
          <div className="flex-1 w-full relative">
            {/* Vertical dashed line (desktop) */}
            <div className="hidden sm:block absolute left-0 top-4 bottom-4 border-l-2 border-dashed border-neutral-200" />

            <div className="space-y-2 sm:pl-6">
              {platforms.map((p, i) => (
                <div
                  key={p.name}
                  className="relative flex items-center gap-3 bg-white border border-neutral-100 rounded-xl px-4 py-3 hover:border-neutral-200 hover:shadow-sm transition-all"
                >
                  {/* Connection dot on the vertical line */}
                  <div className="hidden sm:block absolute -left-[25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-neutral-300" />

                  {/* Platform icon */}
                  <div className={`w-8 h-8 rounded-lg ${p.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-white text-xs font-black">{p.initial}</span>
                  </div>

                  {/* Name + desc */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black leading-tight">{p.name}</p>
                    <p className="text-[11px] text-neutral-400 leading-tight mt-0.5 truncate">{p.desc}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.badge === 'Connected'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-100'
                  }`}>
                    {p.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <p className="text-center text-sm text-neutral-400 mt-8">
          Already selling somewhere?{' '}
          <Link href="/signup" className="text-black font-semibold hover:underline underline-offset-2">
            Bring it all into SellBop →
          </Link>
        </p>
      </div>
    </section>
  )
}

