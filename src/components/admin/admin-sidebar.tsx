import { LayoutDashboard, Users, Store, ShoppingBag, Package, CreditCard, Repeat, Headphones, Settings } from 'lucide-react'
import { SellBopLogoStatic } from '@/components/ui/sellbop-logo'

export type AdminSection =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'buyers'
  | 'products'
  | 'orders'
  | 'subscriptions'
  | 'support'

const NAV: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',       icon: <LayoutDashboard size={15} /> },
  { id: 'users',          label: 'Users',           icon: <Users size={15} /> },
  { id: 'sellers',        label: 'Sellers',         icon: <Store size={15} /> },
  { id: 'buyers',         label: 'Buyers',          icon: <ShoppingBag size={15} /> },
  { id: 'products',       label: 'Products',        icon: <Package size={15} /> },
  { id: 'orders',         label: 'Orders',          icon: <CreditCard size={15} /> },
  { id: 'subscriptions',  label: 'Subscriptions',   icon: <Repeat size={15} /> },
  { id: 'support',        label: 'Support',         icon: <Headphones size={15} /> },
]

interface AdminSidebarProps {
  active: AdminSection
  onChange: (s: AdminSection) => void
}

export function AdminSidebar({ active, onChange }: AdminSidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-neutral-200 bg-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
        <SellBopLogoStatic size="sm" />
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
              active === item.id
                ? 'bg-neutral-100 text-black font-semibold'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-50',
            ].join(' ')}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-100 flex items-center gap-2">
        <Settings size={12} className="text-neutral-300 flex-shrink-0" />
        <p className="text-[10px] text-neutral-400">Internal · Demo mode</p>
      </div>
    </aside>
  )
}
