import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { AdminSidebar, type AdminSection } from '@/components/admin/admin-sidebar'
import { AdminOverview } from '@/components/admin/overview'
import { UsersSection, SellersSection, BuyersSection, ProductsSection } from '@/components/admin/users-section'
import { OrdersSection } from '@/components/admin/orders-section'
import { SubscriptionsSection } from '@/components/admin/subscriptions-section'
import { SupportSection } from '@/components/admin/support-section'
import { requireAdminUser } from '@/lib/admin/access'
import { getAdminOrders, getAdminOverviewData, getAdminSubscriptions, getAdminUsers } from '@/lib/admin/users'

function isAdminSection(value: string | undefined): value is AdminSection {
  return value === 'overview'
    || value === 'users'
    || value === 'sellers'
    || value === 'buyers'
    || value === 'products'
    || value === 'orders'
    || value === 'subscriptions'
    || value === 'support'
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  await requireAdminUser()

  const params = await searchParams
  const section: AdminSection = isAdminSection(params.section) ? params.section : 'overview'

  const usersPromise = getAdminUsers()
  const overviewPromise = getAdminOverviewData()
  const ordersPromise = getAdminOrders()
  const subscriptionsPromise = getAdminSubscriptions()

  const [users, overview, orders, subscriptions] = await Promise.all([
    usersPromise,
    overviewPromise,
    ordersPromise,
    subscriptionsPromise,
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active={section} />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-3">
          <p className="text-xs font-medium capitalize text-neutral-400">
            Admin <span className="mx-1 text-neutral-300">·</span> {section}
          </p>
          <div className="flex items-center gap-3">
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Internal
            </span>
            <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-black">
              <LogOut size={13} />
              Exit
            </Link>
          </div>
        </div>

        <div className={section === 'support' ? 'p-8 pb-0' : 'max-w-6xl p-8'}>
          {section === 'overview' && <AdminOverview data={overview} />}
          {section === 'users' && <UsersSection users={users} />}
          {section === 'sellers' && <SellersSection users={users} />}
          {section === 'buyers' && <BuyersSection users={users} />}
          {section === 'products' && <ProductsSection />}
          {section === 'orders' && <OrdersSection orders={orders} />}
          {section === 'subscriptions' && <SubscriptionsSection subscriptions={subscriptions} />}
          {section === 'support' && <SupportSection />}
        </div>
      </main>
    </div>
  )
}
