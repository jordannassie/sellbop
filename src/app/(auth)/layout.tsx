import Image from 'next/image'
import { Check } from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { HERO_FACEPILE_PHOTOS } from '@/lib/demo-avatars'

const BENEFITS = [
  'No monthly fee',
  'No credit card required to start',
  'Create your first product with AI',
  'Community access',
  'Vote on what we build next',
]

const PROMO_PHOTO = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/0_3.jpg'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Shared header */}
      <header className="h-14 flex items-center px-6 border-b border-neutral-100 bg-white shrink-0">
        <SellBopLogo size="lg" />
      </header>

      {/* Body — form left, promo right */}
      <main className="flex-1 flex flex-col lg:flex-row">

        {/* ── Left: auth form ──────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          {children}
        </div>

        {/* ── Right: promo panel ──────────────────────── */}
        <div className="
          bg-neutral-950 text-white flex flex-col
          mx-4 mb-8 rounded-2xl overflow-hidden
          lg:mx-0 lg:mb-0 lg:rounded-none lg:w-[460px] lg:shrink-0 lg:overflow-y-auto
        ">

          {/* Hero photo */}
          <div className="relative w-full h-52 lg:h-64 shrink-0">
            <Image
              src={PROMO_PHOTO}
              alt="Creator community on SellBop"
              fill
              className="object-cover object-center"
              sizes="460px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/20 to-neutral-950" />
          </div>

          {/* Copy */}
          <div className="px-6 py-7 lg:px-10 lg:py-8 flex flex-col flex-1 justify-between">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 self-start">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                Creator Program
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-[28px] font-black text-white leading-tight mb-2">
                Join the Creator Program
              </h2>

              {/* Subheadline */}
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Start your first online business with AI. Create your product, launch your page, and only pay when you sell.
              </p>

              {/* Benefits — no Founder badge */}
              <ul className="space-y-2.5">
                {BENEFITS.map(b => (
                  <li key={b} className="flex items-center gap-3 text-sm text-neutral-300">
                    <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-green-400" />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Social proof facepile — no CTAs on this panel */}
            <div className="mt-7 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {HERO_FACEPILE_PHOTOS.slice(0, 5).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt="Creator"
                    width={30}
                    height={30}
                    className="w-7 h-7 rounded-full border-2 border-neutral-950 object-cover"
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400 leading-snug">
                <span className="text-white font-semibold">Creators already building</span>
                {' '}— start your first online business today
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
