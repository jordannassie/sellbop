'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/mission',           label: 'Our Mission' },
  { href: '/marketplace',       label: 'Marketplace' },
  { href: '/community',         label: 'Community' },
  { href: '/pricing',           label: 'Pricing' },
  { href: '/demo',              label: 'Demo' },
]

export function MarketingNav() {
  const { session } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => {
              setOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <SellBopLogo size="lg" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors ${pathname === l.href ? 'text-black font-medium' : 'text-neutral-600 hover:text-black'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                {/* Profile identity chip — links to creator storefront profile */}
                <Link
                  href="/dashboard/storefront"
                  className="hidden sm:flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
                >
                  <div className="w-5 h-5 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                    {(session.name?.charAt(0) ?? session.email.charAt(0)).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-neutral-700 group-hover:text-black transition-colors max-w-[72px] truncate leading-none">
                    {session.name?.split(' ')[0] ?? session.email.split('@')[0]}
                  </span>
                </Link>
                <Link href="/dashboard"><Button size="sm" variant="secondary">Dashboard</Button></Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-neutral-600 hover:text-black transition-colors hidden sm:block">Log in</Link>
                <Link href="/signup"><Button size="sm">Get Started</Button></Link>
              </>
            )}
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen(o => !o)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />
          {/* Drawer */}
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b border-neutral-100 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <nav className="px-4 py-3 space-y-1">
              {LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center h-11 px-3 rounded-xl text-sm font-medium transition-colors ${pathname === l.href ? 'bg-neutral-100 text-black' : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'}`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 pb-1 border-t border-neutral-100 mt-2 flex flex-col gap-2">
                {session ? (
                  <>
                    {/* Mobile logged-in: profile row + dashboard */}
                    <Link href="/dashboard/storefront" onClick={() => setOpen(false)} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-neutral-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                        {(session.name?.charAt(0) ?? session.email.charAt(0)).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">{session.name?.split(' ')[0] ?? session.email.split('@')[0]}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{session.email}</p>
                      </div>
                    </Link>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <button className="w-full h-11 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors">
                        Dashboard
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <button className="w-full h-11 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors">
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
