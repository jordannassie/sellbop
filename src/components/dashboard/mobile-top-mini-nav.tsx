'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Package, Plus, Smartphone, Palette, User,
  LayoutDashboard, ShoppingBag, Users, BarChart3, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Editor submenu — shown when user is inside the editing workspace
// (store-editor routes and product routes).
// ─────────────────────────────────────────────────────────────

const EDITOR_ITEMS = [
  { id: 'products', href: '/dashboard/products',                     label: 'Products',    Icon: Package },
  { id: 'add',      href: '/dashboard/products/new',                 label: 'Add Product', Icon: Plus },
  { id: 'preview',  href: '/dashboard/store-editor?section=preview', label: 'Preview',     Icon: Smartphone },
  { id: 'design',   href: '/dashboard/store-editor?section=design',  label: 'Design',      Icon: Palette },
  { id: 'profile',  href: '/dashboard/storefront',                   label: 'Profile',     Icon: User },
]

// ─────────────────────────────────────────────────────────────
// General submenu — shown on all other signed-in pages.
// ─────────────────────────────────────────────────────────────

const GENERAL_ITEMS = [
  { id: 'overview',   href: '/dashboard',            label: 'Overview',  Icon: LayoutDashboard, exact: true },
  { id: 'orders',     href: '/dashboard/orders',     label: 'Orders',    Icon: ShoppingBag },
  { id: 'customers',  href: '/dashboard/customers',  label: 'Customers', Icon: Users },
  { id: 'analytics',  href: '/dashboard/analytics',  label: 'Analytics', Icon: BarChart3 },
  { id: 'settings',   href: '/dashboard/settings',   label: 'Settings',  Icon: Settings },
]

// ─────────────────────────────────────────────────────────────
// Inner — reads URL to pick the right submenu and active item
// ─────────────────────────────────────────────────────────────

function MobileTopMiniNavInner() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const section      = searchParams.get('section')

  // Editor context = store-editor routes OR any product route
  const isEditorContext =
    pathname.startsWith('/dashboard/store-editor') ||
    pathname === '/dashboard/products' ||
    pathname === '/dashboard/products/new' ||
    /^\/dashboard\/products\/.+$/.test(pathname)

  const items = isEditorContext ? EDITOR_ITEMS : GENERAL_ITEMS

  function isActive(id: string, href: string, exact?: boolean): boolean {
    if (isEditorContext) {
      switch (id) {
        case 'products':
          return (
            pathname === '/dashboard/products' ||
            (/^\/dashboard\/products\/.+$/.test(pathname) &&
              pathname !== '/dashboard/products/new')
          )
        case 'add':      return pathname === '/dashboard/products/new'
        case 'preview':  return pathname.startsWith('/dashboard/store-editor') && section === 'preview'
        case 'design':   return pathname.startsWith('/dashboard/store-editor') && section === 'design'
        case 'profile':  return pathname === '/dashboard/storefront'
        default:         return false
      }
    }
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="sm:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-neutral-100 h-10 flex items-center px-2 gap-1 overflow-x-auto scrollbar-none">
      {items.map(({ id, href, label, Icon, ...rest }) => {
        const exact = 'exact' in rest ? (rest as { exact?: boolean }).exact : undefined
        const active = isActive(id, href, exact)
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
              active
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            <Icon size={12} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Public export — Suspense for useSearchParams
// ─────────────────────────────────────────────────────────────

export function MobileTopMiniNav() {
  return (
    <Suspense fallback={
      <div className="sm:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-neutral-100 h-10" />
    }>
      <MobileTopMiniNavInner />
    </Suspense>
  )
}
