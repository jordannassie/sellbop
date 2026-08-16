import Link from 'next/link'
import { CreditCard, LayoutDashboard, Package, ShoppingBag, Store, Users } from 'lucide-react'
import { SellBopLogoStatic } from '@/components/ui/sellbop-logo'

export type AdminSection =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'buyers'
  | 'products'
  | 'orders'

const NAV: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'users', label: 'Users', icon: <Users size={15} /> },
  { id: 'sellers', label: 'Sellers', icon: <Store size={15} /> },
  { id: 'buyers', label: 'Buyers', icon: <ShoppingBag size={15} /> },
  { id: 'products', label: 'Products', icon: <Package size={15} /> },
  { id: 'orders', label: 'Orders', icon: <CreditCard size={15} /> },
]

interface AdminSidebarProps {
  active: AdminSection
}

export function AdminSidebar({ active }: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
        <SellBopLogoStatic size="sm" />
        <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={`/internal/admin?section=${item.id}`}
            className={[
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              active === item.id
                ? 'bg-neutral-100 font-semibold text-black'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-black',
            ].join(' ')}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
