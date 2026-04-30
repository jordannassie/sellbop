import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/product-image'
import { MissionSection } from '@/components/marketing/mission-section'
import { AIPromptBar } from '@/components/marketing/ai-prompt-bar'
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Headphones,
  Package,
  Sparkles,
  Tag,
  ThumbsUp,
  Users2,
  Wand2,
  Bell,
} from 'lucide-react'
import { DEMO_PRODUCTS, DEMO_STOREFRONT, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { HERO_FACEPILE_PHOTOS } from '@/lib/demo-avatars'

export default function HomePage() {
  const featured = DEMO_PRODUCTS.filter(p => p.status === 'published').slice(0, 3)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <Sparkles size={11} className="text-neutral-500" />
          AI-first creator platform
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl font-bold text-black tracking-tight leading-[1.1] mb-5">
          Start your store<br />with AI.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Tell SellBop what you want to sell. We&apos;ll help create your store, product page, pricing, FAQ, checkout copy, and launch plan.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link href="/signup"><Button size="lg">Start Free</Button></Link>
          <Link href="/store/alexjohnson" target="_blank">
            <Button size="lg" variant="secondary">View Demo Store</Button>
          </Link>
        </div>

        {/* AI prompt box */}
        <AIPromptBar />

        {/* Social proof */}
        <div className="flex flex-col items-center gap-3 mt-10">
          <div className="flex items-center -space-x-2.5">
            {HERO_FACEPILE_PHOTOS.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt="Creator"
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
        <p className="text-xs text-neutral-400 mt-4">No credit card required · Demo accounts available</p>
      </section>

      {/* ── Mission / Founder ────────────────────────────────────── */}
      <MissionSection />

      {/* ── Product type examples ─────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">What you can sell</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-3">
              Every type of creator offer
            </h2>
            <p className="text-neutral-500 text-base max-w-md mx-auto">
              Digital downloads, memberships, coaching, bundles — all from one simple store.
            </p>
          </div>

          {/* Product type icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Download, label: 'Digital Downloads', desc: 'PDFs, templates, courses', color: 'bg-blue-50 text-blue-600' },
              { icon: BookOpen, label: 'Subscriptions', desc: 'Memberships & content access', color: 'bg-violet-50 text-violet-600' },
              { icon: Headphones, label: 'Coaching', desc: 'Calls, sessions, services', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Package, label: 'Bundles', desc: 'Collections of any product', color: 'bg-amber-50 text-amber-600' },
            ].map(t => (
              <div key={t.label} className="rounded-2xl border border-neutral-100 bg-white p-5 text-center hover:border-neutral-200 hover:shadow-sm transition-all">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${t.color}`}>
                  <t.icon size={18} />
                </div>
                <p className="font-semibold text-sm text-black mb-1">{t.label}</p>
                <p className="text-xs text-neutral-500">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Live product cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featured.map(p => (
              <Link key={p.id} href={`/p/${p.slug}`}>
                <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                  <div className="aspect-video rounded-lg mb-4 overflow-hidden relative">
                    <ProductImage src={p.thumbnailUrl} alt={p.name} productType={p.productType} fill iconSize="md" />
                  </div>
                  <p className="text-xs text-neutral-400 mb-1 capitalize">{p.productType.replace('_', ' ')}</p>
                  <p className="font-semibold text-black text-sm mb-2 group-hover:underline underline-offset-2">{p.name}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-black">{formatCurrency(p.price, p.currency)}</span>
                    {p.compareAtPrice && (
                      <span className="text-xs text-neutral-400 line-through">{formatCurrency(p.compareAtPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                    <div
                      className="rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black"
                      style={{ width: 24, height: 24, fontSize: 10, backgroundColor: DEMO_STOREFRONT.themeColor }}
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
            <Link href="/store/alexjohnson" className="hover:text-neutral-700 underline underline-offset-2">
              View the full demo store →
            </Link>
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-3">
              How SellBop works
            </h2>
            <p className="text-neutral-500 text-base max-w-sm mx-auto">
              From idea to published store in minutes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: Wand2,
                title: 'Tell AI what you sell',
                desc: 'AI helps draft your store, product page, pricing, FAQ, and launch copy in seconds.',
                color: 'bg-black text-white',
                iconColor: 'text-white',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Review your store',
                desc: 'Edit the AI draft, add your files or links, and preview how your store looks to buyers.',
                color: 'bg-white border border-neutral-200',
                iconColor: 'text-neutral-600',
              },
              {
                step: '03',
                icon: ArrowRight,
                title: 'Publish and share',
                desc: 'Share your SellBop link on social, in your bio, or over email and start selling.',
                color: 'bg-white border border-neutral-200',
                iconColor: 'text-neutral-600',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`relative rounded-2xl p-6 ${item.color}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${i === 0 ? 'bg-white/10' : 'bg-neutral-100'}`}>
                  <item.icon size={18} className={item.iconColor} />
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${i === 0 ? 'text-white/50' : 'text-neutral-400'}`}>
                  Step {item.step}
                </p>
                <p className={`font-bold text-base mb-2 ${i === 0 ? 'text-white' : 'text-black'}`}>
                  {item.title}
                </p>
                <p className={`text-sm leading-relaxed ${i === 0 ? 'text-white/70' : 'text-neutral-500'}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/signup">
              <Button size="lg">
                <Wand2 size={16} /> Start building with AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Founder Creators Program ──────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-4">
            Founder Creators Program
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Join beta and pay{' '}
            <span className="text-green-400">$0 platform fees</span>
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
            Be one of the first creators on SellBop. Launch early, pay $0 platform fees, and help shape what we build next.
          </p>

          {/* Benefit pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {[
              { Icon: Tag, label: '$0 platform fees during beta' },
              { Icon: Users2, label: 'Founder badge' },
              { Icon: ThumbsUp, label: 'Vote on features' },
              { Icon: Bell, label: 'Help shape SellBop' },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white text-xs font-medium px-4 py-2 rounded-full"
              >
                <Icon size={12} className="text-green-400" />
                {label}
              </span>
            ))}
          </div>

          <Link href="/login?mode=signup">
            <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-neutral-100 transition-colors">
              Join the Beta <ArrowRight size={14} />
            </button>
          </Link>
          <p className="text-xs text-neutral-600 mt-4">No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 sm:py-32 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[
              'No credit card required',
              '$0 fees during beta',
              'AI-assisted setup',
            ].map(pill => (
              <span key={pill} className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-500 border border-neutral-200 rounded-full px-3 py-1">
                <Check size={10} className="text-emerald-500" /> {pill}
              </span>
            ))}
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-tight mb-4">
            Ready to start<br />your store?
          </h2>
          <p className="text-neutral-500 text-base sm:text-lg mb-8 max-w-sm mx-auto leading-relaxed">
            Use AI to build your first product page in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/signup">
              <Button size="lg">Start Free</Button>
            </Link>
            <Link href="/store/alexjohnson" target="_blank">
              <Button size="lg" variant="secondary">View Demo Store</Button>
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="inline-block bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Try demo accounts</p>
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-600">
                Creator:{' '}
                <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-black font-mono">creator@sellbop.demo</code>
                {' '}/{' '}
                <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-black font-mono">demo123</code>
              </p>
              <p className="text-xs text-neutral-600">
                Buyer:{' '}
                <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-black font-mono">buyer@sellbop.demo</code>
                {' '}/{' '}
                <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-black font-mono">demo123</code>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
