import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/sellbop',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@sellbop',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@sellbop',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/sellbop',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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

          <div className="flex items-center gap-1 sm:gap-0.5">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all"
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
