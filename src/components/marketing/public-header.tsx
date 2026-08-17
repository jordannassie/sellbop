'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LayoutDashboard, Library, TrendingUp, ShoppingBag, LogOut } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

interface PublicHeaderProps {
  /** Override the active link highlight (e.g. 'marketplace') */
  activeHref?: string
}

export function PublicHeader({ activeHref }: PublicHeaderProps) {
  const { session, signOut } = useAuth()
  const { store } = useUserStore()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const hasSeller = !!store?.slug && store.slug !== 'demo-seller'
  const avatarUrl = store?.avatar_url ?? session?.avatarUrl ?? null

  async function handleSignOut() {
    setUserMenuOpen(false)
    await signOut()
    router.push('/')
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-medium transition-colors ${
        activeHref === href ? 'text-black' : 'text-neutral-500 hover:text-black'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <SellBopLogo size="lg" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 sm:flex">
            {navLink('/marketplace', 'Marketplace')}
            {session && navLink('/dashboard/library', 'Library')}
            {session && navLink('/dashboard/affiliates', 'Affiliates')}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                {hasSeller && (
                  <Link href="/dashboard" className="hidden sm:block">
                    <span className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-400 hover:text-black transition-colors">
                      Dashboard
                    </span>
                  </Link>
                )}

                {/* User avatar/menu button */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 hover:border-neutral-400 transition-colors focus:outline-none"
                    aria-label="User menu"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={session.name ?? 'You'} className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} className="text-neutral-500" />
                    )}
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="text-sm font-semibold text-black truncate">{session.name ?? 'Sellbop User'}</p>
                          <p className="text-xs text-neutral-400 truncate">{session.email}</p>
                        </div>
                        <div className="py-1">
                          {hasSeller && (
                            <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                              <LayoutDashboard size={14} /> Dashboard
                            </Link>
                          )}
                          <Link href="/dashboard/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                            <Library size={14} /> Library
                          </Link>
                          <Link href="/marketplace" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                            <ShoppingBag size={14} /> Marketplace
                          </Link>
                          <Link href="/dashboard/affiliates" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                            <TrendingUp size={14} /> Affiliates
                          </Link>
                          {!hasSeller && (
                            <Link href="/start-selling" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50 transition-colors">
                              Start Selling
                            </Link>
                          )}
                          <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                            <User size={14} /> Settings
                          </Link>
                        </div>
                        <div className="border-t border-neutral-100 py-1">
                          <button onClick={handleSignOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut size={14} /> Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-neutral-500 hover:text-black transition-colors sm:block">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  Start Selling
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors sm:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-0 right-0 top-14 border-b border-neutral-100 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <nav className="space-y-0.5 px-4 py-3">
              <Link href="/marketplace" onClick={() => setMenuOpen(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                Marketplace
              </Link>
              {session && (
                <>
                  <Link href="/dashboard/library" onClick={() => setMenuOpen(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                    Library
                  </Link>
                  <Link href="/dashboard/affiliates" onClick={() => setMenuOpen(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                    Affiliates
                  </Link>
                  {hasSeller && (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors">
                      Dashboard
                    </Link>
                  )}
                </>
              )}
              <div className="border-t border-neutral-100 pt-2 pb-1 flex flex-col gap-2">
                {session ? (
                  <>
                    {!hasSeller && (
                      <Link href="/start-selling" onClick={() => setMenuOpen(false)}>
                        <div className="h-11 flex items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                          Start Selling
                        </div>
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="h-11 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-400 transition-colors w-full">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      <div className="h-11 flex items-center justify-center rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700">
                        Log in
                      </div>
                    </Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>
                      <div className="h-11 flex items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                        Start Selling
                      </div>
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
