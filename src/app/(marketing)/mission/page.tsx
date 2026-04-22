import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, Users2, Zap, Sparkles } from 'lucide-react'

const FOUNDER_IMAGE = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Jordan1.png'

const MISSION_PILLARS = [
  {
    Icon: Heart,
    title: 'Creator-first',
    description: 'We build tools that help creators earn, not just sign up.',
    accent: 'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    Icon: Users2,
    title: 'Community-shaped',
    description: 'The people using SellBop help shape what gets built next.',
    accent: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    Icon: Zap,
    title: 'Built for independence',
    description: 'We want more people to work for themselves on their own terms.',
    accent: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    Icon: Sparkles,
    title: 'Simple to start',
    description: 'Selling online should feel clear, fast, and doable.',
    accent: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
]

export default function MissionPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-24 sm:pb-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">
          Our Mission
        </p>
        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-[1.1] mb-6">
          We exist to help creators<br className="hidden sm:block" /> work for themselves.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-4">
          SellBop helps creators sell directly, grow together, and shape the platform they use.
        </p>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          More than a storefront. A creator-built platform.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOUNDER SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-12 text-center sm:text-left">
            A message from our founder
          </p>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Founder image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-sm mx-auto lg:mx-0 lg:max-w-none shadow-lg">
              <Image
                src={FOUNDER_IMAGE}
                alt="Jordan Nassie — Founder of SellBop"
                fill
                className="object-cover object-top"
                priority
                sizes="(max-width: 1024px) 80vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Founder message */}
            <div className="flex flex-col justify-center">
              <blockquote className="space-y-5 text-[15px] sm:text-base leading-relaxed text-neutral-700">
                <p>
                  Creators should be able to build something of their own.
                </p>
                <p>
                  Too many platforms take too much, control too much, and leave creators building on borrowed ground. SellBop was created to give creators a simpler way to sell what they make, keep more of what they earn, and grow on their own terms.
                </p>
                <p>
                  But there is something bigger here too: the best creator platform should not just be built <em>for</em> creators — it should be shaped <em>by</em> them.
                </p>
                <p>
                  That is why SellBop is being built with community at the center. Creators can sell here, grow here, and help influence what gets built next.
                </p>
                <p className="font-medium text-black">
                  Our mission is simple: help more people work for themselves, build real income from what they know or create, and do it with a platform that actually listens.
                </p>
                <p>
                  We are just getting started — and I am grateful you are here.
                </p>
              </blockquote>

              {/* Sign-off */}
              <div className="mt-8 pt-8 border-t border-neutral-100">
                <p className="text-sm font-bold text-black">Jordan Nassie</p>
                <p className="text-xs text-neutral-400 mt-0.5">Founder, SellBop</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MISSION PILLARS
      ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4">
              What we believe
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Built on these principles
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {MISSION_PILLARS.map(({ Icon, title, description, accent, iconBg, iconColor }) => (
              <div
                key={title}
                className={`bg-white border rounded-2xl p-6 ${accent}`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <h3 className="text-base font-bold text-black mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-24 sm:py-32 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Get started
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-5">
            Build your store.<br />Shape the platform.
          </h2>
          <p className="text-neutral-500 text-base sm:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Join the first wave of creators building on SellBop.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start Free</Button>
            </Link>
            <Link href="/community">
              <button className="inline-flex items-center gap-2 h-12 px-6 text-sm font-semibold text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
                Explore Community
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          <p className="text-xs text-neutral-400 mt-6">No credit card required · Free to start</p>
        </div>
      </section>
    </>
  )
}
