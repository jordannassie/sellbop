import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MissionSection } from '@/components/marketing/mission-section'
import { HeroBanner } from '@/components/marketing/hero-banner'
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

export default function HomePage() {
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
              <div className="rounded-xl border border-neutral-200 bg-white p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Airbnb Calculator</p>
                    <p className="text-2xl font-black text-black">$49</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Sellbop Share</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">ON · 30%</span>
                  </div>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Affiliate earns per sale</span>
                    <span className="text-2xl font-black text-emerald-600">$14.70</span>
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
                  <p className="text-xs font-mono text-neutral-400 truncate">sellbop.com/p/airbnb-calculator?ref=ABC12345</p>
                </div>
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-black">
                  COPY LINK
                </div>
              </div>
            </div>
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
