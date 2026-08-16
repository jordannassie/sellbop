import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

const FOUNDER_IMAGE = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Jordan%20Profile.PNG'

export default function MissionPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-24 sm:pb-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">
          Our Mission
        </p>
        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-[1.1] mb-6">
          We exist to help creators<br className="hidden sm:block" /> work for themselves.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-4">
          Sellbop helps creators sell directly and grow on their own terms.
        </p>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          More than a storefront. A creator-built platform.
        </p>
      </section>

      {/* Founder section */}
      <section className="border-t border-neutral-100 py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-12 text-center sm:text-left">
            A message from our founder
          </p>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Founder image */}
            <div className="flex justify-center lg:block">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md lg:hidden">
                <Image
                  src={FOUNDER_IMAGE}
                  alt="Jordan Nassie — Founder of Sellbop"
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="96px"
                />
              </div>
              <div className="relative hidden lg:block rounded-2xl overflow-hidden aspect-[3/4] shadow-lg">
                <Image
                  src={FOUNDER_IMAGE}
                  alt="Jordan Nassie — Founder of Sellbop"
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>

            {/* Founder message */}
            <div className="flex flex-col justify-center">
              <blockquote className="space-y-5 text-[15px] sm:text-base leading-relaxed text-neutral-700">
                <p>Creators should be able to build something of their own.</p>
                <p>
                  Too many platforms take too much, control too much, and leave creators building on borrowed ground.
                  Sellbop was created to give creators a simpler way to sell what they make, keep more of what they earn,
                  and grow on their own terms.
                </p>
                <p>
                  The best creator platform should not just be built <em>for</em> creators — it should be shaped <em>by</em> them.
                </p>
                <p className="font-medium text-black">
                  Our mission is simple: help more people work for themselves, build real income from what they know or create,
                  and do it with a platform that actually listens.
                </p>
                <p>We are just getting started — and I am grateful you are here.</p>
              </blockquote>

              <div className="mt-8 pt-8 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-black">Jordan Nassie</p>
                  <a
                    href="https://www.linkedin.com/in/jordannassie/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Jordan Nassie on LinkedIn"
                    className="text-neutral-400 hover:text-[#0A66C2] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Founder, Sellbop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-100 py-24 sm:py-32 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Get started
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-5">
            Your first sale starts here.
          </h2>
          <p className="text-neutral-500 text-base sm:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Join the first wave of creators building on Sellbop.
          </p>

          <Link href="/signup">
            <Button size="lg">Start Selling Free</Button>
          </Link>

          <p className="text-xs text-neutral-400 mt-6">No credit card required · Free to start</p>
        </div>
      </section>
    </>
  )
}
