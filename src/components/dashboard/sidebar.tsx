'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingBag, Repeat2, Users,
  BarChart3, Tag, DollarSign, FileDown, Globe, CreditCard,
  Settings, LogOut, Menu, X, Layers, Shirt,
} from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'

const NAV = [
  { href: '/dashboard',               label: 'Overview',       icon: LayoutDashboard, exact: true },
  { href: '/dashboard/storefront',    label: 'Store Profile',  icon: Globe },
  { href: '/dashboard/store-editor',  label: 'Store Editor',   icon: Layers },
  { href: '/dashboard/products',      label: 'Products',       icon: Package },
  { href: '/dashboard/printify',      label: 'Clothing',       icon: Shirt },
  { href: '/dashboard/orders',        label: 'Orders',         icon: ShoppingBag },
  { href: '/dashboard/subscriptions', label: 'Subscriptions',  icon: Repeat2 },
  { href: '/dashboard/customers',     label: 'Customers',      icon: Users },
  { href: '/dashboard/analytics',     label: 'Analytics',      icon: BarChart3 },
  { href: '/dashboard/discounts',     label: 'Discounts',      icon: Tag },
  { href: '/dashboard/payouts',       label: 'Payouts',        icon: DollarSign },
  { href: '/dashboard/files',         label: 'Files',          icon: FileDown },
  { href: '/dashboard/billing',       label: 'Billing',        icon: CreditCard },
  { href: '/dashboard/settings',      label: 'Settings',       icon: Settings },
]

const MOBILE_NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard',               label: 'Overview',       icon: LayoutDashboard, exact: true },
      { href: '/dashboard/storefront',    label: 'Store Profile',  icon: Globe },
      { href: '/dashboard/store-editor',  label: 'Store Editor',   icon: Layers },
      { href: '/dashboard/products',      label: 'Products',       icon: Package },
      { href: '/dashboard/orders',        label: 'Orders',         icon: ShoppingBag },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/dashboard/printify',      label: 'Clothing',       icon: Shirt },
      { href: '/dashboard/subscriptions', label: 'Subscriptions',  icon: Repeat2 },
      { href: '/dashboard/customers',     label: 'Customers',      icon: Users },
      { href: '/dashboard/analytics',     label: 'Analytics',      icon: BarChart3 },
      { href: '/dashboard/discounts',     label: 'Discounts',      icon: Tag },
      { href: '/dashboard/payouts',       label: 'Payouts',        icon: DollarSign },
      { href: '/dashboard/files',         label: 'Files',          icon: FileDown },
      { href: '/dashboard/billing',       label: 'Billing',        icon: CreditCard },
      { href: '/dashboard/settings',      label: 'Settings',       icon: Settings },
    ],
  },
]

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
              active
                ? 'bg-neutral-900 text-white font-medium'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-50',
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        )
      })}
    </>
  )
}

function MobileNavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-5">
      {MOBILE_NAV_GROUPS.map(group => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-neutral-900 text-white font-medium'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-50',
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, session } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  const userBlock = session && (
    <div className="px-5 py-3 border-b border-neutral-100">
      <p className="text-xs font-medium text-neutral-700 truncate">{session.name}</p>
      <p className="text-xs text-neutral-400 truncate">{session.email}</p>
    </div>
  )

  const logoutBtn = (
    <div className="px-3 py-4 border-t border-neutral-100">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors border border-neutral-200 hover:border-red-200"
      >
        <LogOut size={14} /> Log out
      </button>
    </div>
  )

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-neutral-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SellBopLogo size="lg" />
          <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium">DEMO</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ── Mobile overlay (click-to-close backdrop) ─────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-30 bg-black/25 transition-opacity duration-200',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer (slides in from right) ─────────────────────── */}
      <aside
        className={cn(
          'lg:hidden fixed top-14 right-0 bottom-0 w-72 bg-white border-l border-neutral-100 flex flex-col shadow-xl overflow-y-auto z-40 transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!mobileOpen}
      >
        {userBlock}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <MobileNavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>
        {logoutBtn}
      </aside>

      {/* ── Desktop sidebar (always visible on lg+) ───────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-neutral-100 bg-white min-h-screen flex-col">
        <div className="h-14 flex items-center px-5 border-b border-neutral-100 gap-2">
          <SellBopLogo size="lg" />
          <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium">DEMO</span>
        </div>
        {userBlock}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <NavLinks pathname={pathname} />
        </nav>
        {logoutBtn}
      </aside>
    </>
  )
}
