import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const FOUNDER_IMAGE = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Jordan1.png'

export function MissionSection() {
  return (
    <section className="border-t border-neutral-100 bg-white py-12 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">

          {/* Founder photo */}
          <div className="flex-shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={FOUNDER_IMAGE}
                alt="Jordan Nassie — Founder of SellBop"
                fill
                className="object-cover object-top"
                sizes="80px"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2">
              Our Mission
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-snug mb-2">
              We exist to help creators work for themselves.
            </h2>
            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
              SellBop is more than a storefront. It is a creator-built platform where people can sell, grow, and help shape what gets built next.
            </p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <Link
              href="/mission"
              className="inline-flex items-center gap-2 text-sm font-semibold text-black border border-neutral-200 px-5 py-2.5 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
            >
              Read our mission
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
