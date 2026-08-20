import { AdminSidebar, type AdminSection } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { AdminOverview } from '@/components/admin/overview'
import { UsersSection } from '@/components/admin/users-section'
import { SellersSection } from '@/components/admin/sellers-section'
import { BuyersSection } from '@/components/admin/buyers-section'
import { ProductsSection, MarketplaceSection } from '@/components/admin/products-section'
import { AffiliatesSection } from '@/components/admin/affiliates-section'
import { PartnersSection } from '@/components/admin/partners-section'
import { ResourcesAdminSection } from '@/components/admin/resources-section'
import { OrdersSection } from '@/components/admin/orders-section'
import { EmailDeliveriesSection } from '@/components/admin/email-deliveries-section'
import { AdminGlobalSearch } from '@/components/admin/admin-search'
import { requireAdminUser } from '@/lib/admin/access'
import { parseAdminPagination } from '@/lib/admin/helpers'
import { getAdminOverviewData, getAdminUsers, adminGlobalSearch } from '@/lib/admin/users'
import { getAdminOrders } from '@/lib/admin/orders'
import { getAdminProducts } from '@/lib/admin/products'
import { getAdminSellers } from '@/lib/admin/sellers'
import { getAdminBuyers } from '@/lib/admin/buyers'
import { getAdminAffiliates } from '@/lib/admin/affiliates'
import { getAdminPartnerApplications, getNewPartnerApplicationCount } from '@/lib/admin/partner-applications'

function isAdminSection(value: string | undefined): value is AdminSection {
  return value === 'overview'
    || value === 'users'
    || value === 'sellers'
    || value === 'buyers'
    || value === 'products'
    || value === 'orders'
    || value === 'resources'
    || value === 'emails'
    || value === 'affiliates'
    || value === 'partners'
    || value === 'marketplace'
    || value === 'search'
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; page?: string; pageSize?: string; q?: string; filter?: string }>
}) {
  await requireAdminUser()

  const params = await searchParams
  const section: AdminSection = isAdminSection(params.section) ? params.section : 'overview'
  const pagination = parseAdminPagination(params)
  let newPartnerCount = 0
  try {
    newPartnerCount = await getNewPartnerApplicationCount()
  } catch {
    /* table may not exist until migration 027 */
  }

  const [overview] = await Promise.all([
    section === 'overview' ? getAdminOverviewData() : Promise.resolve(null),
  ])

  let content: React.ReactNode = null

  if (section === 'overview' && overview) {
    content = <AdminOverview data={overview} />
  } else if (section === 'users') {
    const data = await getAdminUsers({ ...pagination, q: params.q, filter: params.filter })
    content = <UsersSection users={data.users} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'sellers') {
    const data = await getAdminSellers({ ...pagination, q: params.q, filter: params.filter })
    content = <SellersSection sellers={data.sellers} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'buyers') {
    const data = await getAdminBuyers({ ...pagination, q: params.q, filter: params.filter })
    content = <BuyersSection buyers={data.buyers} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'products') {
    const data = await getAdminProducts({ ...pagination, q: params.q, filter: params.filter })
    content = <ProductsSection products={data.products} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'marketplace') {
    const data = await getAdminProducts({ ...pagination, q: params.q, filter: 'marketplace', marketplaceOnly: true })
    content = <MarketplaceSection products={data.products} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} />
  } else if (section === 'orders') {
    const data = await getAdminOrders({ ...pagination, q: params.q, filter: params.filter })
    content = <OrdersSection orders={data.orders} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'affiliates') {
    const data = await getAdminAffiliates({ ...pagination, q: params.q, filter: params.filter })
    content = <AffiliatesSection affiliates={data.affiliates} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
  } else if (section === 'partners') {
    try {
      const data = await getAdminPartnerApplications({ ...pagination, q: params.q, filter: params.filter })
      content = <PartnersSection applications={data.applications} page={data.page} totalPages={data.totalPages} total={data.total} q={params.q} filter={params.filter} />
    } catch {
      content = (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Partner applications table is not available yet. Apply migration{' '}
          <code className="font-mono text-xs">027_partner_applications.sql</code> in Supabase.
        </div>
      )
    }
  } else if (section === 'emails') {
    content = <EmailDeliveriesSection />
  } else if (section === 'resources') {
    content = <ResourcesAdminSection />
  } else if (section === 'search' && params.q) {
    const results = await adminGlobalSearch(params.q)
    content = <AdminGlobalSearch query={params.q} results={results} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active={section} newPartnerCount={newPartnerCount} />

      <main className="flex-1 overflow-y-auto">
        <AdminTopBar
          section={section}
          searchSlot={(
            <form method="GET" className="hidden md:flex items-center gap-2">
              <input type="hidden" name="section" value="search" />
              <input
                name="q"
                defaultValue={params.q ?? ''}
                placeholder="Search admin…"
                className="w-56 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs focus:border-black focus:outline-none"
              />
            </form>
          )}
        />

        <div className="max-w-6xl p-8">
          {content}
        </div>
      </main>
    </div>
  )
}
