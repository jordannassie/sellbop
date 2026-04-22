'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Users, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/dashboard',            label: 'Overview',  Icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders',     label: 'Orders',    Icon: ShoppingBag },
  { href: '/dashboard/customers',  label: 'Customers', Icon: Users },
  { href: '/dashboard/analytics',  label: 'Analytics', Icon: BarChart3 },
  { href: '/dashboard/settings',   label: 'Settings',  Icon: Settings },
]

// ─────────────────────────────────────────────────────────────
// Compact icon-first top nav strip — mobile only, sits just
// below the fixed site header (top-14). Shows on all signed-in
// dashboard pages so users can reach key sections without the
// hamburger. Desktop is completely untouched (sm:hidden).
// ─────────────────────────────────────────────────────────────

export function MobileTopMiniNav() {
  const pathname = usePathname()

  return (
    <div className="sm:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-neutral-100 h-10 flex items-center px-2 gap-1 overflow-x-auto scrollbar-none">
      {ITEMS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
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
