import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MissionSection } from '@/components/marketing/mission-section'
import { HeroBanner } from '@/components/marketing/hero-banner'
import { AFFILIATE_CLOUD_PHOTOS } from '@/lib/demo-avatars'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import {
  ArrowRight,
  Check,
  Download,
  Link2,
  CreditCard,
  Upload,
  TrendingUp,
  DollarSign,
  Store,
  Handshake,
  BookOpen,
  Table2,
  SlidersHorizontal,
  Palette,
  Camera,
  Code2,
  Plus,
  Zap,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

// Avatar positions for the affiliate creator cloud
// [xPct, yPct, sizePx, badge | null, animDelayS, fallbackHex, mobileVisible]
const AVATAR_SLOTS: [number, number, number, string | null, number, string, boolean][] = [
  [45, 2,  82, '30%',        0.0, '#4F46E5', true ],
  [8,  16, 72, null,         1.5, '#0EA5E9', true ],
  [72, 8,  78, '40%',        0.8, '#F59E0B', true ],
  [28, 54, 70, '$14 / sale', 2.0, '#10B981', true ],
  [62, 50, 74, null,         0.4, '#EC4899', true ],
  [20, 4,  58, null,         1.2, '#8B5CF6', true ],
  [80, 36, 54, '$9 / sale',  1.8, '#EF4444', true ],
  [50, 28, 58, null,         0.6, '#6366F1', true ],
  [4,  54, 54, null,         2.2, '#14B8A6', true ],
  [86, 64, 58, '25%',        1.0, '#F97316', true ],
  [38, 76, 54, null,         0.3, '#06B6D4', true ],
  [66, 74, 58, null,         1.7, '#A855F7', true ],
  [34, 14, 42, null,         2.5, '#475569', false],
  [88, 7,  42, null,         0.9, '#52525B', false],
  [56, 66, 42, null,         1.4, '#57534E', false],
  [14, 77, 42, null,         2.1, '#525252', false],
  [82, 82, 38, null,         0.7, '#6B7280', false],
  [24, 38, 42, null,         3.0, '#71717A', false],
  [93, 44, 38, null,         1.1, '#64748B', false],
  [11, 44, 38, null,         2.8, '#78716C', false],
]

export default async function HomePage() {
  let isAuthenticated = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      isAuthenticated = !!user
    } catch { /* session unavailable — show homepage */ }
  }

  // redirect() must be called outside the try/catch so Next.js can intercept it
  if (isAuthenticated) redirect('/dashboard')
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        {/* Text block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <TrendingUp size={11} />
            Introducing Sellbop Share
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-black tracking-tight leading-[1.05] mb-5">
            Sell digital products.<br className="hidden sm:block" />
            <span className="text-emerald-600">Let everyone sell them.</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Upload your product, choose what affiliates earn, and build your own sales network.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Selling <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {['Free to start', 'No monthly fees', 'Instant delivery'].map(text => (
              <span key={text} className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Check size={13} className="text-emerald-500" /> {text}
              </span>
            ))}
          </div>
        </div>

        {/* Rotating banner showcase */}
        <HeroBanner />
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#00E676' }}>
              How it works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight">
              Upload it. Price it. Sell it.
            </h2>
            <p className="text-neutral-500 mt-4 text-base sm:text-lg">
              Then Sellbop Share helps everyone sell it with you.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-4 sm:gap-4">
            {[
              { step: '1', icon: Upload, title: 'Upload your product', desc: 'Add your PDF, ZIP, template, or any digital file.' },
              { step: '2', icon: CreditCard, title: 'Set your price', desc: 'Choose any price — or make it free for lead magnets.' },
              { step: '3', icon: Link2, title: 'Share your link', desc: 'Post your Sellbop product link anywhere.' },
              { step: '4', icon: Download, title: 'Get paid', desc: 'Buyers checkout and receive their download instantly.' },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {i < 3 && (
                  <div
                    className="hidden sm:flex absolute top-10 left-[calc(50%+3.5rem)] w-[calc(100%-3.5rem)] items-center z-0"
                    aria-hidden="true"
                  >
                    <div className="flex-1 border-t-2 border-dashed border-neutral-200" />
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-0.5" style={{ background: '#00E676' }} />
                    <div className="flex-1 border-t-2 border-dashed border-neutral-200" />
                  </div>
                )}
                <div className="relative z-10 w-full">
                  <div className="relative mx-auto w-full max-w-[168px] aspect-square rounded-3xl bg-white border border-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center mb-5">
                    <span
                      className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{ background: '#00E676' }}
                    >
                      {item.step}
                    </span>
                    <item.icon size={36} strokeWidth={1.75} style={{ color: '#00E676' }} />
                  </div>
                  <p className="font-bold text-base text-black mb-2">{item.title}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 shadow-sm">
              <Sparkles size={14} style={{ color: '#00E676' }} />
              <span className="text-sm font-medium text-neutral-600">Simple for you. Powerful for everyone.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SellBop Partner Program ───────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Partner image — stacks above text on mobile */}
            <div className="order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/partners/9:16/8cd4d768-ef41-48b0-ac48-add6357a8530.png"
                alt="SellBop Partner — verified creator with premium digital products and growing sales"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="order-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#00E676' }}>
                SellBop Partnerships
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-[1.1] mb-5">
                You Bring the Audience.<br />
                We Build the Business.
              </h2>
              <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-8">
                SellBop partners with creators to build premium digital product businesses around their brand. We create the store, products, checkout, delivery, and affiliate infrastructure — then we share the revenue.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  {
                    icon: Store,
                    title: 'Your Branded Store',
                    desc: 'We build and manage your digital storefront.',
                  },
                  {
                    icon: BookOpen,
                    title: 'Premium Digital Products',
                    desc: 'We create guides, workbooks, blueprints, and other digital products for your audience.',
                  },
                  {
                    icon: Zap,
                    title: 'SellBop Handles Everything',
                    desc: 'Product creation, checkout, delivery, affiliates, and infrastructure.',
                  },
                  {
                    icon: Handshake,
                    title: 'Revenue Share Partnership',
                    desc: 'No upfront product-development cost. We succeed when you succeed.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(0,230,118,0.12)' }}
                    >
                      <Icon size={16} style={{ color: '#00E676' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">{title}</p>
                      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-start gap-4">
                <a href="mailto:hello@sellbop.com?subject=SellBop%20Partnership%20Application">
                  <Button
                    size="lg"
                    className="font-black"
                    style={{ background: '#00E676', color: '#000', borderColor: '#00E676' }}
                  >
                    Become a SellBop Partner <ArrowRight size={16} />
                  </Button>
                </a>
                <a
                  href="mailto:hello@sellbop.com?subject=How%20SellBop%20Partnerships%20Work"
                  className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
                >
                  See How Partnerships Work →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Become an Affiliate ───────────────────────────────────── */}
      <section className="border-t border-neutral-900 py-28 bg-[#080808] overflow-hidden">
        <style>{`
          @keyframes avatarFloat {
            0%,100% { transform: translateY(0px) scale(1); }
            50%      { transform: translateY(-9px) scale(1.01); }
          }
        `}</style>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Headline block */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 border border-[#00E676]/40 text-[#00E676] text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-6">
              <DollarSign size={10} aria-hidden="true" />
              For Affiliates
            </span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-5">
              Become an affiliate<br />
              <span style={{ color: '#00E676' }}>of your favorite creators.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Share digital products you believe in. Earn commission every time someone buys through your link.
            </p>
          </div>

          {/* Two-column: avatar cloud + steps */}
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-20 items-center mb-20">

            {/* ── Avatar Cloud ── */}
            <div
              aria-hidden="true"
              className="relative order-1 w-full overflow-hidden rounded-3xl"
              style={{ height: 'clamp(300px, 55vw, 490px)' }}
            >
              {/* subtle radial glow in background */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,230,118,0.06) 0%, transparent 70%)',
                }}
              />

              {AVATAR_SLOTS.map(([xPct, yPct, size, badge, delay], i) => {
                const avatarUrl = AFFILIATE_CLOUD_PHOTOS[i % AFFILIATE_CLOUD_PHOTOS.length]
                const isMobileVisible = AVATAR_SLOTS[i][6]

                return (
                  <div
                    key={i}
                    className={isMobileVisible ? 'absolute' : 'absolute hidden sm:block'}
                    style={{
                      left: `${xPct}%`,
                      top:  `${yPct}%`,
                      width:  size,
                      height: size,
                      animation: `avatarFloat ${3 + (delay % 1.5)}s ease-in-out ${delay}s infinite`,
                    }}
                  >
                    <div className="relative w-full h-full rounded-full ring-2 ring-white/20 overflow-hidden shadow-lg shadow-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Commission badge */}
                    {badge && (
                      <span
                        className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black text-black leading-none shadow-md whitespace-nowrap"
                        style={{ background: '#00E676', fontSize: size < 56 ? '9px' : '10px' }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Steps + CTA ── */}
            <div className="order-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-7">
                How it works
              </p>

              <div className="space-y-7 mb-10">
                {[
                  {
                    n: '1',
                    title: 'Find a product',
                    desc:  'Browse the Sellbop Marketplace for digital products and creators you want to promote.',
                  },
                  {
                    n: '2',
                    title: 'Copy your link',
                    desc:  'Sellbop instantly generates your unique affiliate link — no setup, no code.',
                  },
                  {
                    n: '3',
                    title: 'Earn when it sells',
                    desc:  'Every time someone buys through your link, the commission goes directly to you.',
                  },
                ].map(s => (
                  <div key={s.n} className="flex gap-4 items-start">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm"
                      style={{ background: '#00E676' }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1">{s.title}</p>
                      <p className="text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-black"
                    style={{ background: '#00E676', color: '#000', borderColor: '#00E676' }}
                  >
                    Explore Products to Promote <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>

              {/* Key differentiator */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-white font-black text-lg leading-snug mb-1.5">
                  You don&apos;t need your own product to earn on Sellbop.
                </p>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Anyone with a Sellbop account can promote affiliate-enabled products and keep their commission.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: network flow */}
          <div className="border-t border-white/10 pt-10 flex items-center justify-center gap-3 flex-wrap">
            {['Find it', 'Copy it', 'Share it', 'Earn'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-400">{step}</span>
                {i < arr.length - 1 && (
                  <ArrowRight size={13} className="text-neutral-600 flex-shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you can sell ─────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#00E676' }}>
              What you can sell
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-3">
              Any digital product
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-base sm:text-lg">
              If you can put it in a file, you can sell it on Sellbop.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-3 gap-4">

            {/* Center hero — first on mobile */}
            <div className="order-first sm:order-none sm:col-start-2 sm:row-start-1 sm:row-span-3 relative overflow-hidden rounded-3xl min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/partners/9:16/Screenshot%202026-08-19%20at%204.02.23%20PM.png"
                alt="Creator selling digital products on SellBop"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/65" />
              <div className="relative z-10 h-full p-8 flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">All digital. All yours.</h3>
                <p className="text-neutral-300 text-sm mb-8">Upload once. Sell unlimited.</p>
                <Link href="/signup">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform">
                    <ArrowRight size={18} className="text-black" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Left column */}
            {[
              { label: 'eBooks & PDFs', desc: 'Write it. Export it. Sell it everywhere.', Icon: BookOpen, grid: 'sm:col-start-1 sm:row-start-1' },
              { label: 'Software & Scripts', desc: 'Tools, plugins, and code.', Icon: Code2, grid: 'sm:col-start-1 sm:row-start-2' },
              { label: 'Presets & Filters', desc: 'Photo, video, and creative presets.', Icon: SlidersHorizontal, grid: 'sm:col-start-1 sm:row-start-3' },
            ].map(({ label, desc, Icon, grid }) => (
              <div
                key={label}
                className={`group relative rounded-3xl border border-neutral-200 bg-white p-6 flex flex-col justify-between min-h-[160px] hover:border-neutral-300 hover:shadow-md transition-all duration-200 ${grid}`}
              >
                <div>
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,230,118,0.12)' }}
                  >
                    <Icon size={20} style={{ color: '#00E676' }} />
                  </div>
                  <p className="font-bold text-black text-base mb-1">{label}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={16} className="text-neutral-400" />
                </div>
              </div>
            ))}

            {/* Right column */}
            {[
              { label: 'Design Assets', desc: 'Graphics, mockups, icons & more.', Icon: Palette, grid: 'sm:col-start-3 sm:row-start-1' },
              { label: 'Templates & Spreadsheets', desc: 'Docs, sheets, and ready-to-use kits.', Icon: Table2, grid: 'sm:col-start-3 sm:row-start-2' },
              { label: 'Photography', desc: 'Photos, stock, and bundles.', Icon: Camera, grid: 'sm:col-start-3 sm:row-start-3' },
            ].map(({ label, desc, Icon, grid }) => (
              <div
                key={label}
                className={`group relative rounded-3xl border border-neutral-200 bg-white p-6 flex flex-col justify-between min-h-[160px] hover:border-neutral-300 hover:shadow-md transition-all duration-200 ${grid}`}
              >
                <div>
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,230,118,0.12)' }}
                  >
                    <Icon size={20} style={{ color: '#00E676' }} />
                  </div>
                  <p className="font-bold text-black text-base mb-1">{label}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed pr-8">{desc}</p>
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={16} className="text-neutral-400" />
                </div>
              </div>
            ))}
          </div>

          {/* And more bar */}
          <div className="mt-4 rounded-full border border-neutral-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,230,118,0.12)' }}
              >
                <Plus size={16} style={{ color: '#00E676' }} />
              </div>
              <span className="font-bold text-black text-sm">And more...</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['Courses & Lessons', 'Printables', 'Notion Templates', 'Data & Reports', 'Stock Media', 'Fonts & Typography'].map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600"
                >
                  <Check size={11} style={{ color: '#00E676' }} />
                  {tag}
                </span>
              ))}
              <span className="text-xs text-neutral-400 pl-1">and more</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Tools / MCP ────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 bg-neutral-900 text-[#00E676] text-[11px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-5">
              <Zap size={10} aria-hidden="true" /> MCP Powered
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-tight mb-4">
              Build Products With Your AI
            </h2>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Connect Claude, Higgsfield, and other AI tools to create digital products, generate images, build product pages, and sell everything through SellBop.
            </p>
          </div>

          {/* ── Two integration cards ── */}
          <div className="grid sm:grid-cols-2 gap-5">

            {/* Claude */}
            <div className="group rounded-3xl border border-neutral-200 bg-neutral-50 p-7 flex flex-col hover:border-neutral-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Tools/claude-ai-logo-rounded-hd-free-png.webp"
                  alt="Claude"
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                />
                <span className="rounded-full bg-orange-100 text-orange-700 text-[11px] font-black px-2.5 py-1 tracking-wide">
                  AI Agent
                </span>
              </div>
              <h3 className="text-2xl font-black text-black mb-2">Claude</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                Tell Claude what you want to sell and let it help build the entire product.
              </p>

              <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-6">
                {[
                  'Research product ideas',
                  'Write product content',
                  'Create guides & files',
                  'Write descriptions',
                  'Set pricing',
                  'Configure affiliates',
                  'Upload assets',
                  'Publish products',
                ].map(c => (
                  <div key={c} className="flex items-start gap-1.5 text-xs text-neutral-600">
                    <Check size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              {/* Prompt box */}
              <div className="rounded-2xl bg-neutral-900 p-4 mb-6 flex-1">
                <p className="text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">Prompt</p>
                <p className="text-sm text-white leading-relaxed">
                  &ldquo;Create me a $49 digital product for Airbnb hosts, build the files, add the listing, turn affiliates on at 30%, and save it as a draft.&rdquo;
                </p>
              </div>

              <Link href="/dashboard/settings">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white text-sm font-bold px-4 py-3 hover:bg-neutral-800 transition-colors">
                  Connect Claude <ArrowRight size={14} />
                </button>
              </Link>
            </div>

            {/* Higgsfield */}
            <div className="group rounded-3xl border border-neutral-200 bg-neutral-50 p-7 flex flex-col hover:border-neutral-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Tools/output.webp"
                  alt="Higgsfield"
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                />
                <span className="rounded-full bg-violet-100 text-violet-700 text-[11px] font-black px-2.5 py-1 tracking-wide">
                  Images + Video
                </span>
              </div>
              <h3 className="text-2xl font-black text-black mb-2">Higgsfield</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                Let your AI generate professional product visuals without leaving the workflow.
              </p>

              <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-6">
                {[
                  'Product cover images',
                  'Marketplace thumbnails',
                  'Product mockups',
                  'Promo graphics',
                  'Social media creatives',
                  'Lifestyle images',
                  'Product videos',
                  'Ad creatives',
                ].map(c => (
                  <div key={c} className="flex items-start gap-1.5 text-xs text-neutral-600">
                    <Check size={11} className="text-violet-500 flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="rounded-2xl bg-neutral-900 p-4 mb-6 flex-1">
                <p className="text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">How it works</p>
                <p className="text-sm text-white leading-relaxed">
                  Claude can use Higgsfield MCP to generate the visuals, then upload them directly into your SellBop product.
                </p>
              </div>

              <Link href="/dashboard/settings">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-black text-sm font-bold px-4 py-3 hover:border-neutral-300 hover:shadow-sm transition-all">
                  Connect Higgsfield <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────── */}
      <MissionSection />

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Start selling.
          </h2>
          <p className="text-neutral-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Create your product and let your network help sell it.
          </p>

          <Link href="/signup">
            <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-neutral-100 transition-colors">
              Start Selling <ArrowRight size={14} />
            </button>
          </Link>
          <p className="text-xs text-neutral-600 mt-4">Free to start · No credit card required</p>
        </div>
      </section>
    </>
  )
}
