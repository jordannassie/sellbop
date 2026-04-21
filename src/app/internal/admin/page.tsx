'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { AdminSidebar, type AdminSection } from '@/components/admin/admin-sidebar'
import { AdminOverview } from '@/components/admin/overview'
import { UsersSection, SellersSection, BuyersSection, ProductsSection } from '@/components/admin/users-section'
import { OrdersSection } from '@/components/admin/orders-section'
import { SubscriptionsSection } from '@/components/admin/subscriptions-section'
import { SupportSection } from '@/components/admin/support-section'

function SectionContent({ section }: { section: AdminSection }) {
  switch (section) {
    case 'overview':      return <AdminOverview />
    case 'users':         return <UsersSection />
    case 'sellers':       return <SellersSection />
    case 'buyers':        return <BuyersSection />
    case 'products':      return <ProductsSection />
    case 'orders':        return <OrdersSection />
    case 'subscriptions': return <SubscriptionsSection />
    case 'support':       return <SupportSection />
  }
}

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('overview')
  const router = useRouter()

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active={section} onChange={setSection} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-8 py-3 flex items-center justify-between">
          <p className="text-xs text-neutral-400 font-medium capitalize">
            Admin <span className="text-neutral-300 mx-1">·</span> {section}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Internal
            </span>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black font-medium transition-colors"
            >
              <LogOut size={13} />
              Exit
            </button>
          </div>
        </div>

        {/* Section content */}
        <div className="p-8 max-w-6xl">
          <SectionContent section={section} />
        </div>
      </main>
    </div>
  )
}
