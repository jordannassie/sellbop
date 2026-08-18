import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/sellbopcom',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/sellbopcom',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
]

const NAV_LINKS = [
  ['Sell', '/signup'],
  ['Login', '/login'],
  ['Dashboard', '/dashboard'],
  ['Terms', '/terms'],
  ['Privacy', '/privacy'],
  ['Refund Policy', '/refund-policy'],
  ['Support', '/support'],
  ['Admin', '/internal/admin'],
] as const

export function MarketingFooter() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Brand + social */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-100">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2">
              <SellBopLogo size="sm" />
            </div>
            <p className="text-xs text-neutral-500">Upload it. Price it. Sell it.</p>
          </div>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <nav
          aria-label="Footer"
          className="py-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5"
        >
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-neutral-500 hover:text-black transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Payment + copyright */}
        <div className="pt-5 border-t border-neutral-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Sellbop</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/payment-cards.png"
            alt="Accepted payment methods: American Express, Apple Pay, Diners Club, Discover, Google Pay, Mastercard, PayPal, Shop Pay, Visa"
            className="h-6 opacity-70"
          />
        </div>
      </div>
    </footer>
  )
}
