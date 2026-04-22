import Link from 'next/link'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { HERO_FACEPILE_PHOTOS } from '@/lib/demo-avatars'

const BENEFITS = [
  '$0 platform fees in beta',
  'Founder badge on your profile',
  'Early access to new features',
  'Priority support',
  'Help vote on what we build next',
]

// Supabase-hosted hero image for the promo panel
const PROMO_PHOTO = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/0_3.jpg'

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
          mx-4 mb-8 rounded-2xl overflow-hidden
          lg:mx-0 lg:mb-0 lg:rounded-none lg:w-[480px] lg:shrink-0
          lg:overflow-y-auto
        ">

          {/* ── Hero photo at top of panel ──────────────── */}
          <div className="relative w-full h-52 lg:h-60 shrink-0 overflow-hidden">
            <Image
              src={PROMO_PHOTO}
              alt="Creator community on SellBop"
              fill
              className="object-cover object-center"
              sizes="480px"
              priority
            />
            {/* Dark gradient overlay so copy below is readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/30 to-neutral-950" />
          </div>

          {/* ── Panel copy ─────────────────────────────── */}
          <div className="px-6 py-8 lg:px-12 lg:pb-12 flex flex-col">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 self-start">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
              Beta Program
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
              Join the Founder Creators Program
            </h2>

            {/* Subheadline */}
            <p className="text-neutral-400 text-sm leading-relaxed mb-7">
              Get $0 platform fees during beta and help shape the future of SellBop. Build your store. Shape the platform.
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-7">
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
            <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
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

            {/* Social proof facepile — real Pravatar faces */}
            <div className="pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {HERO_FACEPILE_PHOTOS.slice(0, 5).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt="Founder creator"
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full border-2 border-neutral-950 object-cover"
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                <span className="text-white font-semibold">Founders already in beta</span>
                {' '}— join the first wave
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
