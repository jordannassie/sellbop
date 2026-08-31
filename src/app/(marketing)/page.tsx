import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MissionSection } from '@/components/marketing/mission-section'
import { HeroBanner } from '@/components/marketing/hero-banner'
import { HomeSchoolSection } from '@/components/marketing/home-school-section'
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

      <HomeSchoolSection />

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

      {/* ── Mission ───────────────────────────────────────────────── */}
      <MissionSection />

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Start selling.
          </h2>
          <p className="text-white/75 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Create your product and let your network help sell it.
          </p>

          <Link href="/signup">
            <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-neutral-100 transition-colors">
              Start Selling <ArrowRight size={14} />
            </button>
          </Link>
          <p className="text-white/50 text-xs mt-4">Free to start · No credit card required</p>
        </div>
      </section>
    </>
  )
}
