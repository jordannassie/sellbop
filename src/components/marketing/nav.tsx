'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { SellBopLogoStatic } from '@/components/ui/sellbop-logo'

const LINKS = [
  { href: '/school', label: 'School' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/support', label: 'Support' },
]

export function MarketingNav() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" onClick={() => setOpen(false)}>
            <SellBopLogoStatic size="lg" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/school" className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-black sm:block">
              School
            </Link>
            <Link href="/marketplace" className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-black sm:block">
              Marketplace
            </Link>
            <Link href="/pricing" className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-black sm:block">
              Pricing
            </Link>
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-neutral-600 transition-colors hover:text-black sm:block">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button size="sm">Start Selling</Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 sm:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 right-0 top-14 border-b border-neutral-100 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1 px-4 py-3">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 border-t border-neutral-100 pb-1 pt-2">
                {session ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <Button className="w-full" size="sm">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <button className="h-11 w-full rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-400 transition-colors">
                        Log in
                      </button>
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      <Button className="w-full" size="sm">Start Selling</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
