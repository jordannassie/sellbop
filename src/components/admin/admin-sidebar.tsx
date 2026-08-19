import Link from 'next/link'
import { CreditCard, GraduationCap, Handshake, LayoutDashboard, Mail, Package, ShoppingBag, Store, TrendingUp, ShoppingCart, Users } from 'lucide-react'
import { SellBopLogoStatic } from '@/components/ui/sellbop-logo'

export type AdminSection =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'buyers'
  | 'products'
  | 'orders'
  | 'resources'
  | 'emails'
  | 'affiliates'
  | 'partners'
  | 'partnerships'
  | 'marketplace'
  | 'search'

const NAV: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'users', label: 'Users', icon: <Users size={15} /> },
  { id: 'sellers', label: 'Sellers', icon: <Store size={15} /> },
  { id: 'buyers', label: 'Buyers', icon: <ShoppingBag size={15} /> },
  { id: 'products', label: 'Products', icon: <Package size={15} /> },
  { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart size={15} /> },
  { id: 'orders', label: 'Orders', icon: <CreditCard size={15} /> },
  { id: 'affiliates', label: 'Affiliates', icon: <TrendingUp size={15} /> },
  { id: 'partners', label: 'Partners', icon: <Handshake size={15} /> },
  { id: 'partnerships', label: 'Partnerships', icon: <Store size={15} /> },
  { id: 'emails', label: 'Emails', icon: <Mail size={15} /> },
  { id: 'resources', label: 'Resources', icon: <GraduationCap size={15} /> },
]

interface AdminSidebarProps {
  active: AdminSection
  newPartnerCount?: number
}

export function AdminSidebar({ active, newPartnerCount = 0 }: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
        <SellBopLogoStatic size="sm" />
        <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.id === 'partnerships' ? '/internal/admin/partnerships' : `/internal/admin?section=${item.id}`}
            className={[
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              active === item.id
                ? 'bg-neutral-100 font-semibold text-black'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-black',
            ].join(' ')}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.id === 'partners' && newPartnerCount > 0 && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                {newPartnerCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
