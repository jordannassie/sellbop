import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/product-image'
import { RotatingWord } from '@/components/marketing/rotating-word'
import { StrategyCallSection } from '@/components/marketing/strategy-call-section'
import { MissionSection } from '@/components/marketing/mission-section'
import { Check, ArrowRight, FileText, ShoppingBag, Pencil, Download, MapPin, Zap, Sparkles, Tag, Users2, ThumbsUp, Bell } from 'lucide-react'
import { DEMO_PRODUCTS, DEMO_STOREFRONT, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { HERO_FACEPILE_PHOTOS } from '@/lib/demo-avatars'

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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link href="/signup"><Button size="lg">Start Free</Button></Link>
          <Link href="/demo"><Button size="lg" variant="secondary">See Demo</Button></Link>
        </div>

        {/* Social proof facepile */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center -space-x-2.5">
            {HERO_FACEPILE_PHOTOS.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt="Founder creator"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 shadow-sm">
              +99
            </div>
          </div>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-black">142 creators</span> active this week
          </p>
        </div>

        <p className="text-xs text-neutral-400 mt-5">Demo accounts available · No credit card required</p>
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

      {/* ── Our Mission thin section ─────────────────────────────── */}
      <MissionSection />

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
          INTEGRATIONS — Connect the platforms you already sell on
      ══════════════════════════════════════════════════════════════ */}
      <PlatformIntegrationsSection />

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
          FOUNDER CREATORS PROGRAM
      ══════════════════════════════════════════════════════════════ */}
      <FounderCreatorsProgramSection />

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

// ── Founder Creators Program Section ─────────────────────────────────────────
// No Founder badge — practical creator benefits only

const FOUNDER_BENEFITS = [
  { Icon: Tag,      label: '$0 platform fees',    desc: 'Pay nothing during beta.' },
  { Icon: Users2,   label: 'Community access',    desc: 'Discuss ideas with other creators.' },
  { Icon: ThumbsUp, label: 'Vote on features',    desc: 'Directly influence the roadmap.' },
  { Icon: Bell,     label: 'Early updates',       desc: 'First access to every new release.' },
]

const FCP_PHOTO = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/0_3.jpg'

function FounderCreatorsProgramSection() {
  return (
    <section className="py-24 sm:py-32 bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Two-column layout: photo left, content right */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-0">

          {/* Left — photo */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[420px] order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FCP_PHOTO}
              alt="Creator community on SellBop"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
            {/* Beta pill overlay */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Beta — limited spots
            </div>
          </div>

          {/* Right — content */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-5">
              Founder Creators Program
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
              Join beta and pay<br />
              <span className="text-green-400">$0 platform fees</span>
            </h2>
            <p className="text-neutral-400 text-base leading-relaxed mb-8">
              Be one of the first creators on SellBop. Launch early, pay $0 platform fees during beta, and help shape what we build next.
            </p>

            {/* Benefit cards — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {FOUNDER_BENEFITS.map(({ Icon, label, desc }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2.5">
                    <Icon size={15} className="text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug mb-1">{label}</p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login?mode=signup">
                <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors">
                  Join the Beta <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/community">
                <button className="inline-flex items-center gap-2 border border-white/20 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                  Explore Community
                </button>
              </Link>
            </div>

            <p className="text-xs text-neutral-600 mt-4">
              Build your store. Shape the platform. A win-win roadmap with creators.
            </p>
          </div>

        </div>

      </div>
    </section>
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
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-0">

          {/* LEFT — SellBop hub */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0 sm:w-40">
            {/* Big rounded square icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#22C55E] flex items-center justify-center shadow-lg">
                <ShoppingBag size={34} strokeWidth={2} className="text-white" />
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
          <div className="hidden sm:flex flex-col items-center justify-center w-16 flex-shrink-0">
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

