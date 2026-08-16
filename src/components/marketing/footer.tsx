import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

export function MarketingFooter() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2">
            <SellBopLogo size="sm" />
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">Upload it. Price it. Sell it.</span>
          </div>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Sellbop</p>
        </div>

        <div className="border-t border-neutral-100 pt-5 flex items-center justify-center flex-wrap gap-x-5 gap-y-2">
          {[
            ['Sell', '/signup'],
            ['Login', '/login'],
            ['Dashboard', '/dashboard'],
            ['Terms', '/terms'],
            ['Privacy', '/privacy'],
            ['Refund Policy', '/refund-policy'],
            ['Support', '/support'],
            ['Admin', '/internal/admin'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-xs text-neutral-500 hover:text-black transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
