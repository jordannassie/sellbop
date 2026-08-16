import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const FOUNDER_IMAGE = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Jordan%20Profile.PNG'

export function MissionSection() {
  return (
    <section className="border-t border-neutral-100 bg-white py-12 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">

          {/* Founder photo + name */}
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start gap-2">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={FOUNDER_IMAGE}
                alt="Jordan Nassie — Founder of SellBop"
                fill
                className="object-cover object-top"
                sizes="80px"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-black leading-none">Jordan Nassie</p>
              <a
                href="https://www.linkedin.com/in/jordannassie/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Jordan Nassie on LinkedIn"
                className="text-neutral-400 hover:text-[#0A66C2] transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
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
