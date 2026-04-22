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

// Decorative creator avatar stack — illustrative only
const CREATOR_AVATARS = [
  { initials: 'AJ', color: '#7C3AED' },
  { initials: 'SK', color: '#2563EB' },
  { initials: 'MR', color: '#059669' },
  { initials: 'TW', color: '#D97706' },
]

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
        {/* Mobile: card below form; Desktop: fixed-width right column */}
        <div className="
          bg-neutral-950 text-white flex flex-col justify-center
          mx-4 mb-8 rounded-2xl px-6 py-10
          lg:mx-0 lg:mb-0 lg:rounded-none lg:w-[460px] lg:shrink-0 lg:px-12 lg:py-14
        ">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-7 self-start">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
            Beta Program
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
            Join the Founder Creators Program
          </h2>

          {/* Subheadline */}
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Get $0 platform fees during beta and help shape the future of SellBop.
          </p>

          {/* Benefits */}
          <ul className="space-y-3 mb-9">
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
          <div className="mt-9 pt-7 border-t border-white/10 flex items-center gap-3">
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
