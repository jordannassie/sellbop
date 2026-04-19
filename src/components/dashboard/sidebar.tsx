'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Tag, DollarSign, FileDown, Globe, CreditCard, Settings, LogOut, Zap } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/discounts', label: 'Discounts', icon: Tag },
  { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/dashboard/files', label: 'Files', icon: FileDown },
  { href: '/dashboard/storefront', label: 'Storefront', icon: Globe },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, session } = useAuth()

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="w-56 shrink-0 border-r border-neutral-100 bg-white min-h-screen flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-neutral-100">
        <Link href="/" className="text-base font-bold text-black">Selli</Link>
        <span className="ml-2 text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium">DEMO</span>
      </div>
      {session && (
        <div className="px-5 py-3 border-b border-neutral-100">
          <p className="text-xs font-medium text-neutral-700 truncate">{session.name}</p>
          <p className="text-xs text-neutral-400 truncate">{session.email}</p>
        </div>
      )}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', active ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-500 hover:text-black hover:bg-neutral-50')}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
        <div className="pt-2 border-t border-neutral-100 mt-2">
          <Link href="/internal/demo-center" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 transition-colors">
            <Zap size={15} />
            Demo Center
          </Link>
        </div>
      </nav>
      <div className="px-2 py-3 border-t border-neutral-100">
        <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors w-full">
          <LogOut size={15} />Log out
        </button>
      </div>
    </aside>
  )
}
