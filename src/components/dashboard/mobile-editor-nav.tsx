'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Store, Package, ShoppingCart, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Main mobile bottom nav — 5 primary destinations ──────────────────────────

const BOTTOM_NAV = [
  {
    id: 'overview',
    label: 'Overview',
    Icon: LayoutDashboard,
    href: '/dashboard',
    exact: true,
    activePaths: [] as string[],
  },
  {
    id: 'store',
    label: 'Store',
    Icon: Store,
    href: '/dashboard/store',
    exact: false,
    activePaths: ['/dashboard/storefront', '/dashboard/store-editor'],
  },
  {
    id: 'products',
    label: 'Products',
    Icon: Package,
    href: '/dashboard/products',
    exact: false,
    activePaths: [] as string[],
  },
  {
    id: 'sales',
    label: 'Sales',
    Icon: ShoppingCart,
    href: '/dashboard/sales',
    exact: false,
    activePaths: ['/dashboard/orders', '/dashboard/subscriptions', '/dashboard/customers', '/dashboard/analytics'],
  },
  {
    id: 'library',
    label: 'Library',
    Icon: BookOpen,
    href: '/dashboard/library',
    exact: false,
    activePaths: [] as string[],
  },
]

function MobileBottomNavInner() {
  const pathname = usePathname()

  function isActive(item: typeof BOTTOM_NAV[number]): boolean {
    if (item.exact) return pathname === item.href
    if (pathname.startsWith(item.href)) return true
    return item.activePaths.some(p => pathname.startsWith(p))
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 flex items-stretch h-14 safe-area-inset-bottom">
      {BOTTOM_NAV.map(item => {
        const active = isActive(item)
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              active ? 'text-black' : 'text-neutral-400',
            )}
          >
            <item.Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function MobileEditorNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  )
}
