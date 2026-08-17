'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Store,
  Users,
  DollarSign,
  ShoppingBag,
  X,
  Plus,
  TrendingUp,
  Grid3x3,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { cn } from '@/lib/utils'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  exact?: boolean
  activePaths?: string[]
}

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  if (pathname.startsWith(item.href)) return true
  return (item.activePaths ?? []).some(p => pathname.startsWith(p))
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem
  pathname: string
  onClick?: () => void
}) {
  const active = isNavActive(item, pathname)
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-neutral-900 font-medium text-white'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <item.icon size={16} />
      {item.label}
    </Link>
  )
}

const CREATE_OPTIONS = [
  { label: 'Create with AI', href: '/dashboard/ai-launch' },
  { label: 'Create manually', href: '/dashboard/products/new' },
  { label: 'View products', href: '/dashboard/products' },
]

function CreateMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative px-2 pt-3 pb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus size={15} /> Create
        </span>
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full z-20 mt-1 rounded-xl border border-neutral-100 bg-white py-1.5 shadow-lg">
            {CREATE_OPTIONS.map(opt => (
              <Link
                key={opt.href}
                href={opt.href}
                onClick={() => { setOpen(false); onNavigate?.() }}
                className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors"
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UserAvatar({
  avatarUrl,
  name,
  email,
  sizeClass,
  textClass,
}: {
  avatarUrl?: string | null
  name?: string | null
  email: string
  sizeClass: string
  textClass: string
}) {
  const [imgError, setImgError] = useState(false)
  const initial = ((name?.charAt(0) ?? email.charAt(0)) || 'U').toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? email}
        className={cn(sizeClass, 'rounded-full object-cover flex-shrink-0')}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold flex-shrink-0',
        textClass,
      )}
    >
      {initial}
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, session, account } = useAuth()
  const { store } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const hasStore = !!(account?.hasStore || store)

  const sellerNav: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/store', label: 'Store', icon: Store, activePaths: ['/dashboard/storefront', '/dashboard/store-editor'] },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/sales', label: 'Sales', icon: ShoppingBag, activePaths: ['/dashboard/orders'] },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/marketplace', label: 'Marketplace', icon: Grid3x3 },
    { href: '/dashboard/affiliates', label: 'Affiliates', icon: TrendingUp },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/resources', label: 'Resources', icon: GraduationCap },
    { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, activePaths: ['/dashboard/settings/ai-integrations', '/dashboard/billing'] },
  ]

  const buyerNav: NavItem[] = [
    { href: '/marketplace', label: 'Marketplace', icon: Grid3x3 },
    { href: '/dashboard/affiliates', label: 'Affiliates', icon: TrendingUp },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/resources', label: 'Resources', icon: GraduationCap },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const nav = hasStore ? sellerNav : buyerNav

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  const avatarUrl = session?.avatarUrl ?? store?.avatar_url ?? null
  const profileHref = hasStore && store?.slug ? `/${store.slug}` : '/dashboard/settings'
  const displayName = session?.name ?? session?.email?.split('@')[0] ?? 'You'
  const initial = (displayName.charAt(0) || 'U').toUpperCase()
  const storeHref = store?.slug ? `/${store.slug}` : null

  const userBlock = session && (
    <div className="flex flex-col items-center px-4 pt-6 pb-4 border-b border-neutral-100">
      <Link href={profileHref} className="group mb-3 block" title="View your store">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-neutral-100 bg-neutral-900 flex items-center justify-center group-hover:ring-neutral-300 transition-all">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <span className="text-white font-bold text-xl select-none">{initial}</span>
          )}
        </div>
      </Link>
      <Link href={profileHref} className="group">
        <p className="text-sm font-semibold text-neutral-900 text-center truncate max-w-[168px] leading-snug group-hover:underline underline-offset-2 transition-colors">
          {displayName}
        </p>
      </Link>
      <p className="text-[11px] text-neutral-400 text-center truncate max-w-[168px] mt-0.5">
        {session.email}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-red-600 lg:hidden"
      >
        <LogOut size={12} /> Log out
      </button>
    </div>
  )

  const createArea = (onNavigate?: () => void) => (
    <div className="px-2 pt-3 pb-2 space-y-2">
      {hasStore ? (
        <CreateMenu onNavigate={onNavigate} />
      ) : (
        <Link
          href="/start-selling"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <Store size={15} /> Start Selling
        </Link>
      )}
      {storeHref && (
        <a
          href={storeHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: '#00E676' }}
        >
          <ExternalLink size={14} /> View Store
        </a>
      )}
    </div>
  )

  const logoutBtn = (
    <div className="border-t border-neutral-100 px-3 py-3">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={15} /> Log out
      </button>
    </div>
  )

  const navLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
      {nav.map(item => (
        <NavLink key={item.href} item={item} pathname={pathname} onClick={onNavigate} />
      ))}
    </nav>
  )

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:hidden">
        <SellBopLogo size="lg" />
        <div className="flex items-center gap-2">
          {session && (
            <Link href="/dashboard/settings">
              <UserAvatar
                avatarUrl={avatarUrl}
                name={session.name}
                email={session.email}
                sizeClass="h-8 w-8"
                textClass="text-xs"
              />
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/25 transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed bottom-0 right-0 top-14 z-40 flex w-72 translate-x-full flex-col overflow-y-auto border-l border-neutral-100 bg-white shadow-xl transition-transform duration-200 ease-out pb-16 lg:hidden',
          mobileOpen && 'translate-x-0',
        )}
        aria-hidden={!mobileOpen}
      >
        {userBlock}
        {createArea(() => setMobileOpen(false))}
        {navLinks(() => setMobileOpen(false))}
      </aside>

      <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r border-neutral-100 bg-white lg:flex">
        <div className="flex h-14 items-center border-b border-neutral-100 px-5">
          <SellBopLogo size="lg" />
        </div>
        {userBlock}
        {createArea()}
        {navLinks()}
        {logoutBtn}
      </aside>
    </>
  )
}
