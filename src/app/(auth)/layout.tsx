import Image from 'next/image'
import { Check } from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { HERO_FACEPILE_PHOTOS } from '@/lib/demo-avatars'

const BENEFITS = [
  'Your branded digital storefront',
  'Premium PDFs, guides, workbooks & products',
  'SellBop handles checkout and delivery',
  'Built-in affiliate infrastructure',
  'Revenue-share partnership',
]

const PARTNER_IMAGE = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/partners/9:16/00b10ff6-4ea2-4b6e-9c54-f6b840f1a535.png'

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

          {/* Partner image */}
          <div className="relative w-full h-72 lg:h-80 shrink-0 bg-neutral-950">
            <Image
              src={PARTNER_IMAGE}
              alt="SellBop Partner — creator building a digital product business"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 28%' }}
              sizes="460px"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />
          </div>

          {/* Copy */}
          <div className="px-6 py-7 lg:px-10 lg:py-8 flex flex-col flex-1 justify-between">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 self-start">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                SellBop Partnerships
              </div>

              <h2 className="text-2xl sm:text-[28px] font-black text-white leading-tight mb-2">
                You Bring the Audience.<br />
                We Build the Business.
              </h2>

              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                SellBop partners with creators to build premium digital product businesses around their brand. We create the store, products, checkout, delivery, and affiliate system — then share the revenue.
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

            {/* Social proof + partner positioning */}
            <div className="mt-7 pt-6 border-t border-white/10">
              <div className="flex -space-x-2.5 mb-3">
                {HERO_FACEPILE_PHOTOS.slice(0, 5).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    width={30}
                    height={30}
                    className="w-7 h-7 rounded-full border-2 border-neutral-950 object-cover bg-neutral-800"
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                <span className="text-white font-semibold">Built for creators who already have an audience.</span>
                {' '}You focus on your community. SellBop builds the digital product business behind it.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
