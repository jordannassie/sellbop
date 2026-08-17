import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MissionSection } from '@/components/marketing/mission-section'
import { HeroBanner } from '@/components/marketing/hero-banner'
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
  Users,
  DollarSign,
  BookOpen,
  Table2,
  SlidersHorizontal,
  Palette,
  Camera,
  Code2,
  Music2,
  ListChecks,
  Plus,
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
  let creatorAvatarUrls: string[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient()
      const [{ data: { user } }, { data: storeData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('stores')
          .select('avatar_url')
          .not('avatar_url', 'is', null)
          .limit(20),
      ])
      isAuthenticated = !!user
      if (storeData) {
        creatorAvatarUrls = storeData
          .map(s => s.avatar_url as string)
          .filter(Boolean)
      }
    } catch { /* session or DB unavailable — show homepage with placeholders */ }
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
      <section className="border-t border-neutral-100 py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Upload it. Price it. Sell it.
            </h2>
            <p className="text-neutral-500 mt-3 text-base">
              Then Sellbop Share helps everyone sell it with you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-4">
            {[
              { step: '1', icon: Upload, title: 'Upload your product', desc: 'Add your PDF, ZIP, template, or any digital file.' },
              { step: '2', icon: CreditCard, title: 'Set your price', desc: 'Choose any price — or make it free for lead magnets.' },
              { step: '3', icon: Link2, title: 'Share your link', desc: 'Post your Sellbop product link anywhere.' },
              { step: '4', icon: Download, title: 'Get paid', desc: 'Buyers checkout and receive their download instantly.' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden sm:block absolute top-8 left-full w-full h-px bg-neutral-200 -translate-y-px z-0" style={{ width: 'calc(100% - 2rem)', left: '75%' }} />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-4 shadow-sm">
                    <item.icon size={22} className="text-neutral-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Step {item.step}</span>
                  <p className="font-bold text-sm text-black mb-2">{item.title}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-[160px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sellbop Share / Affiliate Network ─────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <TrendingUp size={11} />
                Sellbop Share
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight mb-4">
                Build your own affiliate network.
              </h2>
              <p className="text-neutral-500 text-base leading-relaxed mb-6">
                Stop being the only person selling your product. Set the commission. Sellbop handles the links, tracking, sales, and commissions.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: Users, text: 'Customers and fans become your salespeople' },
                  { icon: DollarSign, text: 'You only pay when they actually make a sale' },
                  { icon: TrendingUp, text: 'Real-time tracking for every click and conversion' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon size={14} className="text-emerald-600" />
                    </div>
                    <p className="text-sm text-neutral-700">{text}</p>
                  </div>
                ))}
              </div>
              <Link href="/signup">
                <Button size="lg">
                  Build Your Network <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            {/* Visual mockup */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
              <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-4">
                {/* Product cover image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/HOLD.png"
                  alt="Digital Product"
                  className="w-full object-cover rounded-t-xl"
                  style={{ aspectRatio: '16/7', objectFit: 'cover' }}
                />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Digital Product</p>
                      <p className="text-2xl font-black text-black">$49</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">Sellbop Share</p>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: '#ecfff6', color: '#00A854' }}>ON · 30%</span>
                    </div>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <div className="flex justify-between text-sm items-baseline">
                      <span className="text-neutral-500">Affiliate earns per sale</span>
                      <span className="text-2xl font-black" style={{ color: '#00E676' }}>$14.70</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Affiliates', value: '47' },
                  { label: 'Affiliate Sales', value: '312' },
                  { label: 'Revenue', value: '$15,288' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                    <p className="text-lg font-black text-black">{s.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-black p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-mono text-neutral-400 truncate">sellbop.com/creator/product?ref=ABC12345</p>
                </div>
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-black">
                  COPY LINK
                </div>
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

              {AVATAR_SLOTS.map(([xPct, yPct, size, badge, delay, color], i) => {
                const avatarUrl = creatorAvatarUrls[i] ?? null
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
                    {/* Avatar circle */}
                    <div
                      className="relative w-full h-full rounded-full ring-2 ring-white/10 overflow-hidden flex items-center justify-center"
                      style={{ background: color }}
                    >
                      {avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          width={Math.round(size * 0.5)}
                          height={Math.round(size * 0.5)}
                          viewBox="0 0 24 24"
                          fill="rgba(255,255,255,0.35)"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      )}
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

      {/* ── Marketplace ───────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">Marketplace</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-3">
            Discover what&apos;s selling.
          </h2>
          <p className="text-neutral-500 max-w-sm mx-auto text-base mb-8">
            Browse digital products from independent creators. Buy, download, or share and earn.
          </p>
          <Link href="/marketplace">
            <Button size="lg" variant="secondary">
              Explore Marketplace <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── What you can sell ─────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">What you can sell</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-3">
              Any digital product
            </h2>
            <p className="text-neutral-500 max-w-sm mx-auto text-base">
              If you can put it in a file, you can sell it on Sellbop.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'eBooks & PDFs',            Icon: BookOpen },
              { label: 'Templates & Spreadsheets', Icon: Table2 },
              { label: 'Presets & Filters',        Icon: SlidersHorizontal },
              { label: 'Design Assets',            Icon: Palette },
              { label: 'Photography',              Icon: Camera },
              { label: 'Software & Scripts',       Icon: Code2 },
              { label: 'Audio & Music',            Icon: Music2 },
              { label: 'Guides & Checklists',      Icon: ListChecks },
              { label: 'And more…',               Icon: Plus },
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 hover:border-neutral-300 hover:shadow-sm transition-all duration-150"
              >
                <Icon size={16} style={{ color: '#00E676' }} className="flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-700">{label}</span>
              </div>
            ))}
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
