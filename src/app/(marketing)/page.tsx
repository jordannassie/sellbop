import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Check,
  Download,
  Link2,
  CreditCard,
  Upload,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Simple. Fast. Reliable.
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-black tracking-tight leading-[1.05] mb-5">
          Sell anything.<br className="hidden sm:block" /> Simple.
        </h1>

        <p className="text-lg sm:text-xl text-neutral-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Upload your digital product, set your price, share your link — and get paid.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start Selling <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Log in
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {['No monthly fees', 'Free to start', 'Simple setup'].map(text => (
            <span key={text} className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Check size={13} className="text-emerald-500" /> {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Upload it. Price it. Sell it.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-4">
            {[
              {
                step: '1',
                icon: Upload,
                title: 'Upload your product',
                desc: 'Add your PDF, ZIP, template, or any digital file.',
              },
              {
                step: '2',
                icon: CreditCard,
                title: 'Set your price',
                desc: 'Choose any price — or make it free for lead magnets.',
              },
              {
                step: '3',
                icon: Link2,
                title: 'Share your link',
                desc: 'Post your Sellbop product link anywhere.',
              },
              {
                step: '4',
                icon: Download,
                title: 'Get paid',
                desc: 'Buyers checkout and receive their download instantly.',
              },
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

      {/* ── What you can sell ─────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">Perfect for</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-3">
              Any digital product
            </h2>
            <p className="text-neutral-500 max-w-sm mx-auto text-base">
              If you can put it in a file, you can sell it on Sellbop.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'eBooks & PDFs',
              'Templates & Spreadsheets',
              'Presets & Filters',
              'Design Assets',
              'Photography',
              'Software & Scripts',
              'Audio & Music',
              'Videos & Courses',
              'Guides & Checklists',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 text-center hover:border-neutral-300 hover:bg-white transition-all"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 bg-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Ready to start selling?
          </h2>
          <p className="text-neutral-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Create your first product in minutes. No monthly fees, no complicated setup.
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
