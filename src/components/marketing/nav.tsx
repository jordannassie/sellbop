'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { SellBopLogoStatic } from '@/components/ui/sellbop-logo'

const LINKS = [
  { href: '/mission', label: 'Our Mission' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/community', label: 'Community' },
  { href: '/pricing', label: 'Pricing' },
]

export function MarketingNav() {
  const { session, account } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const profileHref = '/dashboard'

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            onClick={() => {
              setOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <SellBopLogoStatic size="lg" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href ? 'font-medium text-black' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                <Link
                  href={profileHref}
                  className="group hidden h-8 items-center gap-2 rounded-xl border border-neutral-200 pl-1.5 pr-3 transition-all hover:border-neutral-300 hover:bg-neutral-50 sm:flex"
                >
                  {session.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.avatarUrl}
                      alt={session.name ?? session.email}
                      className="h-5 w-5 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[9px] font-black text-white">
                      {(session.name?.charAt(0) ?? session.email.charAt(0)).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[72px] truncate text-xs font-medium leading-none text-neutral-700 transition-colors group-hover:text-black">
                    {session.name?.split(' ')[0] ?? session.email.split('@')[0]}
                  </span>
                </Link>

                {(account?.hasPurchases || account?.hasSubscriptions) && (
                  <Link href="/dashboard/purchases">
                    <Button size="sm" variant="secondary">Purchases</Button>
                  </Link>
                )}

                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-neutral-600 transition-colors hover:text-black sm:block">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
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
                  className={`flex h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors ${
                    pathname === link.href ? 'bg-neutral-100 text-black' : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pb-1 pt-2">
                {session ? (
                  <>
                    <Link href={profileHref} onClick={() => setOpen(false)} className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-neutral-50">
                      {session.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.avatarUrl}
                          alt={session.name ?? session.email}
                          className="h-7 w-7 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[11px] font-black text-white">
                          {(session.name?.charAt(0) ?? session.email.charAt(0)).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">
                          {session.name?.split(' ')[0] ?? session.email.split('@')[0]}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400">{session.email}</p>
                      </div>
                    </Link>

                    {(account?.hasPurchases || account?.hasSubscriptions) && (
                      <Link href="/dashboard/purchases" onClick={() => setOpen(false)}>
                        <button className="h-11 w-full rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400">
                          Purchases
                        </button>
                      </Link>
                    )}

                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <button className="h-11 w-full rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400">
                        Dashboard
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <button className="h-11 w-full rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400">
                        Log in
                      </button>
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      <Button className="w-full" size="sm">Get Started</Button>
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
