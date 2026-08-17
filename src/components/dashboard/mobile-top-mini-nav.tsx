'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package, Plus,
  Users, Tag, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Context-sensitive submenu above the bottom nav ────────────────────────────
// Adapts based on which section the user is in.

function MobileContextualSubmenuInner() {
  const pathname = usePathname()

  const isProductsContext = pathname.startsWith('/dashboard/products')

  const isSalesContext =
    pathname.startsWith('/dashboard/sales') ||
    pathname.startsWith('/dashboard/orders') ||
    pathname.startsWith('/dashboard/subscriptions') ||
    pathname.startsWith('/dashboard/customers') ||
    pathname.startsWith('/dashboard/discounts') ||
    pathname.startsWith('/dashboard/payouts')

  const productItems = [
    { id: 'all', href: '/dashboard/products', label: 'All', Icon: Package },
    { id: 'new', href: '/dashboard/products/new', label: 'New', Icon: Plus },
  ]

  const salesItems = [
    { id: 'customers', href: '/dashboard/customers', label: 'Customers', Icon: Users },
    { id: 'discounts', href: '/dashboard/discounts', label: 'Discounts', Icon: Tag },
    { id: 'payouts', href: '/dashboard/payouts', label: 'Payouts', Icon: DollarSign },
  ]

  const items = isProductsContext
    ? productItems
    : isSalesContext
      ? salesItems
      : null

  if (!items) return null

  return (
    <div className="sm:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-neutral-100 h-10 flex items-center px-2 gap-1 overflow-x-auto">
      {items.map(({ id, href, label, Icon }) => {
        const active = href.includes('?')
          ? pathname.startsWith(href.split('?')[0]!)
          : pathname === href || pathname.startsWith(href + '/')
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

export function MobileTopMiniNav() {
  return (
    <Suspense fallback={
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-neutral-100 h-10" />
    }>
      <MobileContextualSubmenuInner />
    </Suspense>
  )
}
