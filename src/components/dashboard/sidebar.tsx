'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  FileDown,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Repeat2,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  exact?: boolean
}

function DashboardSidebarLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-neutral-900 font-medium text-white'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, session } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/storefront', label: 'Store Profile', icon: Globe },
    { href: '/dashboard/store-editor', label: 'Store Editor', icon: Layers },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/products/ai-builder', label: 'AI Builder', icon: Sparkles },
    { href: '/dashboard/printify', label: 'Clothing', icon: Shirt },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: Repeat2 },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/discounts', label: 'Discounts', icon: FileDown },
    { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/dashboard/files', label: 'Files', icon: FileDown },
    { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const navItems = nav

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  const userBlock = session && (
    <div className="border-b border-neutral-100 px-5 py-4">
      <p className="truncate text-xs font-semibold text-neutral-800">
        {session.name ?? session.email.split('@')[0]}
      </p>
      <p className="mt-0.5 truncate text-xs text-neutral-400">{session.email}</p>
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

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <SellBopLogo size="lg" />
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <Link
              href="/dashboard"
              title="Your profile"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white transition-colors hover:bg-neutral-700"
            >
              {(session.name?.charAt(0) ?? session.email.charAt(0)).toUpperCase()}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100"
            aria-label="Toggle navigation menu"
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
        {userBlock}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <DashboardSidebarLinks
            items={navItems}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </nav>
        {logoutBtn}
      </aside>

      <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r border-neutral-100 bg-white lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-100 px-5">
          <SellBopLogo size="lg" />
        </div>
        {userBlock}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          <DashboardSidebarLinks items={navItems} pathname={pathname} />
        </nav>
        {logoutBtn}
      </aside>
    </>
  )
}
