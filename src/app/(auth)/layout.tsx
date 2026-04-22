import Link from 'next/link'
import { Check } from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

const BENEFITS = [
  '$0 platform fees in beta',
  'Founder badge on your profile',
  'Early access to new features',
  'Priority support',
  'Help vote on what we build next',
]

const CREATOR_AVATARS = [
  { initials: 'AJ', color: '#7C3AED' },
  { initials: 'SK', color: '#2563EB' },
  { initials: 'MR', color: '#059669' },
  { initials: 'TW', color: '#D97706' },
]

// ─────────────────────────────────────────────────────────────
// Visual mock composition — illustrative creator community
// preview inside the promo panel. CSS-only, no image assets.
// ─────────────────────────────────────────────────────────────
function CreatorMockVisual() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden mb-8">
      {/* Store card */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-tight">Sarah Creates</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Digital artist · sellbop.com/sarah</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-emerald-400">$2,840</p>
            <p className="text-[10px] text-neutral-500">this month</p>
          </div>
        </div>
      </div>

      {/* Community post preview */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="text-[10px] font-black text-emerald-400">▲</div>
            <div className="text-[10px] font-bold text-white">47</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full mb-1.5">
              Feature Request
            </div>
            <p className="text-xs font-semibold text-white leading-snug">Add custom domain support for creator stores</p>
            <p className="text-[10px] text-neutral-500 mt-1">u/alexjohnson · 12 comments</p>
          </div>
        </div>
      </div>

      {/* Product cards row */}
      <div className="px-4 py-3 flex gap-2">
        {[
          { label: 'Design Pack', price: '$29', color: 'from-violet-600 to-blue-600' },
          { label: 'Coaching Call', price: '$150', color: 'from-emerald-600 to-teal-600' },
        ].map(p => (
          <div key={p.label} className="flex-1 bg-white/5 rounded-xl overflow-hidden">
            <div className={`h-8 bg-gradient-to-br ${p.color} opacity-60`} />
            <div className="px-2 py-1.5">
              <p className="text-[9px] font-semibold text-white truncate">{p.label}</p>
              <p className="text-[10px] font-black text-white">{p.price}</p>
            </div>
          </div>
        ))}
        {/* Founder badge card */}
        <div className="w-14 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center py-2 px-1">
          <div className="text-base">🏅</div>
          <p className="text-[8px] font-bold text-amber-400 text-center leading-tight mt-1">Founder</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Shared header */}
      <header className="h-14 flex items-center px-6 border-b border-neutral-100 bg-white shrink-0">
        <SellBopLogo size="lg" />
      </header>

      {/* Body — form left, promo right (stacked on mobile) */}
      <main className="flex-1 flex flex-col lg:flex-row">

        {/* ── Left: auth form ─────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          {children}
        </div>

        {/* ── Right: Founder Creators Program promo ───────── */}
        <div className="
          bg-neutral-950 text-white flex flex-col justify-center
          mx-4 mb-8 rounded-2xl px-6 py-10
          lg:mx-0 lg:mb-0 lg:rounded-none lg:w-[480px] lg:shrink-0 lg:px-12 lg:py-12
          lg:overflow-y-auto
        ">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 self-start">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
            Beta Program
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
            Join the Founder Creators Program
          </h2>

          {/* Subheadline */}
          <p className="text-neutral-400 text-sm leading-relaxed mb-7">
            Get $0 platform fees during beta and help shape the future of SellBop.
          </p>

          {/* Visual mock composition */}
          <CreatorMockVisual />

          {/* Benefits */}
          <ul className="space-y-3 mb-8">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-green-400" />
                </div>
                {b}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/login?mode=signup"
              className="flex-1 flex items-center justify-center h-11 bg-white text-black text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Join the Beta
            </Link>
            <Link
              href="/community"
              className="flex-1 flex items-center justify-center h-11 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Explore Community
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {CREATOR_AVATARS.map(({ initials, color }) => (
                <div
                  key={initials}
                  className="w-7 h-7 rounded-full border-2 border-neutral-950 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              <span className="text-white font-semibold">Founders already in beta</span>
              {' '}— join them today
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
