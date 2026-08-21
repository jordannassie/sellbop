'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Package, Settings, Store, Users, DollarSign, ShoppingBag, Tag, X, Plus, TrendingUp, Grid3x3, ExternalLink, Shield, Sparkles, Lightbulb, } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { cn } from '@/lib/utils'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { ShopSwitcher } from '@/components/dashboard/shop-switcher'
import { PartnerShopPreviewButton } from '@/components/dashboard/partner-shop-preview-button'

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
  const {
    store,
    stores,
    activeStoreId,
    switching,
    isDemo,
    switchStore,
    createStore,
  } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const hasStore = !!(account?.hasStore || store || stores.length > 0)
  const activeSummary = stores.find(s => s.id === activeStoreId) ?? null

  const sellerNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/product-ideas', label: 'Product Ideas', icon: Lightbulb },
    { href: '/dashboard/ai-agent', label: 'AI Agent', icon: Sparkles },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/sales', label: 'Sales', icon: ShoppingBag, activePaths: ['/dashboard/orders'] },
    ...(activeSummary?.isPartnerShop
      ? [{ href: '/dashboard/earnings', label: 'Earnings', icon: DollarSign }]
      : []),
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/marketplace', label: 'Marketplace', icon: Grid3x3 },
    { href: '/dashboard/affiliates', label: 'Affiliates', icon: TrendingUp },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/resources', label: 'Resources', icon: GraduationCap },
    { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
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

  const storeHref = store?.slug
    ? (activeSummary?.isPartnerShop && activeSummary.partnershipStatus !== 'active'
      ? null
      : `/store/${store.slug}`)
    : null
  const isUnpublishedPartner = !!(activeSummary?.isPartnerShop && activeSummary.partnershipStatus !== 'active')

  const shopBlock = hasStore && stores.length > 0 && (
    <ShopSwitcher
      stores={stores}
      activeStoreId={activeStoreId}
      activeStore={activeSummary}
      switching={switching}
      isDemo={isDemo}
      onSwitch={switchStore}
      onCreate={createStore}
      onClose={() => setMobileOpen(false)}
    />
  )

  const createBtn = (onNavigate?: () => void) => (
    <div className="px-2 pt-3 pb-2 space-y-2">
      {hasStore ? (
        <Link
          href="/dashboard/products/new"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus size={15} /> Create Product
        </Link>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          <ExternalLink size={14} /> View Store
        </a>
      )}
      {isUnpublishedPartner && store?.slug && (
        <PartnerShopPreviewButton onNavigate={onNavigate} />
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
      {account?.isPlatformAdmin && (
        <Link
          href="/internal/admin"
          onClick={onNavigate}
          className="mb-1 flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          <Shield size={16} />
          Admin
        </Link>
      )}
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
                avatarUrl={activeSummary?.avatar_url ?? store?.avatar_url}
                name={activeSummary?.name ?? store?.name}
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
          'fixed bottom-0 right-0 top-14 z-40 flex w-72 translate-x-full flex-col overflow-y-auto border-l border-neutral-100 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden',
          mobileOpen && 'translate-x-0',
        )}
        aria-hidden={!mobileOpen}
      >
        {shopBlock}
        {createBtn(() => setMobileOpen(false))}
        {navLinks(() => setMobileOpen(false))}
        {logoutBtn}
      </aside>

      <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r border-neutral-100 bg-white lg:flex">
        <div className="flex h-14 items-center border-b border-neutral-100 px-5">
          <SellBopLogo size="lg" />
        </div>
        {shopBlock}
        {createBtn()}
        {navLinks()}
        {logoutBtn}
      </aside>
    </>
  )
}
