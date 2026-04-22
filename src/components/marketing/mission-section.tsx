import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function MissionSection() {
  return (
    <section className="border-t border-neutral-100 bg-white py-14 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

          {/* Text content */}
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3">
              Our Mission
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-snug mb-3">
              We exist to help creators<br className="hidden sm:block" /> work for themselves.
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
