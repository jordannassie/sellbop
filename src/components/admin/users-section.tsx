'use client'

import { DEMO_USERS, DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_SUBSCRIPTIONS, DEMO_PRODUCTS, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
]

function Avatar({ name }: { name: string }) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    creator: 'bg-blue-50 text-blue-700 border-blue-200',
    buyer:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    admin:   'bg-neutral-200 text-neutral-700 border-neutral-300',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg[role] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
      {role}
    </span>
  )
}

function EmptyDemo({ entity }: { entity: string }) {
  return (
    <tr>
      <td colSpan={10} className="py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">No real {entity} yet</p>
        <p className="text-xs text-neutral-300 mt-1">Real accounts will appear here once Supabase is connected.</p>
      </td>
    </tr>
  )
}

function TH({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 py-3 px-4 whitespace-nowrap">{children}</th>
}
function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-4 text-sm ${className}`}>{children}</td>
}

const isDemo = (email: string) => email.endsWith('.demo') || email.includes('@sellbop.demo')

// ─── Users ────────────────────────────────────────────────────────────────────

export function UsersSection() {
  const baseUsers = [
    { id: 'admin-1', email: 'admin@sellbop.com', name: 'SellBop Admin', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
    ...DEMO_USERS,
  ]
  const users = baseUsers

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Users</h1>
        <span className="text-sm text-neutral-400">{users.length} total</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr><TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Joined</TH><TH>{''}</TH></tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.length === 0 && <EmptyDemo entity="users" />}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <span className="font-medium text-black whitespace-nowrap">{u.name}</span>
                    </div>
                  </TD>
                  <TD className="text-neutral-500 whitespace-nowrap">{u.email}</TD>
                  <TD><RoleBadge role={u.role} /></TD>
                  <TD className="text-neutral-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</TD>
                  <TD className="text-right">
                    <button className="text-xs text-neutral-400 hover:text-black font-medium">View →</button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Sellers ──────────────────────────────────────────────────────────────────

export function SellersSection() {
  const allSellers = [
    {
      id: DEMO_SELLER_PROFILE.id,
      name: DEMO_SELLER_PROFILE.displayName,
      email: 'creator@sellbop.demo',
      plan: DEMO_SELLER_PROFILE.plan,
      productCount: DEMO_PRODUCTS.length,
      revenue: DEMO_ORDERS.reduce((s, o) => s + o.amount, 0),
      customerCount: DEMO_CUSTOMERS.length,
      joinedAt: DEMO_SELLER_PROFILE.createdAt,
    },
  ]
  const sellers = allSellers

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Sellers</h1>
        <span className="text-sm text-neutral-400">{sellers.length} total</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr><TH>Name</TH><TH>Email</TH><TH>Plan</TH><TH>Products</TH><TH>Revenue</TH><TH>Customers</TH><TH>{''}</TH></tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {sellers.length === 0 && <EmptyDemo entity="sellers" />}
              {sellers.map(s => (
                <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} />
                      <span className="font-medium text-black whitespace-nowrap">{s.name}</span>
                    </div>
                  </TD>
                  <TD className="text-neutral-500 whitespace-nowrap">{s.email}</TD>
                  <TD>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">{s.plan}</span>
                  </TD>
                  <TD className="text-neutral-600">{s.productCount}</TD>
                  <TD className="font-semibold text-black whitespace-nowrap">{formatCurrency(s.revenue)}</TD>
                  <TD className="text-neutral-600">{s.customerCount}</TD>
                  <TD className="text-right">
                    <button className="text-xs text-neutral-400 hover:text-black font-medium">View →</button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Buyers ───────────────────────────────────────────────────────────────────

export function BuyersSection() {
  const allBuyers = DEMO_CUSTOMERS
  const buyers = allBuyers

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Buyers</h1>
        <span className="text-sm text-neutral-400">{buyers.length} total</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr><TH>Name</TH><TH>Email</TH><TH>Purchases</TH><TH>Total Spent</TH><TH>Subscriptions</TH><TH>Last Purchase</TH><TH>{''}</TH></tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {buyers.length === 0 && <EmptyDemo entity="buyers" />}
              {buyers.map(c => {
                const activeSubs = DEMO_SUBSCRIPTIONS.filter(s => s.customerId === c.id && s.status === 'active').length
                return (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="font-medium text-black whitespace-nowrap">{c.name}</span>
                      </div>
                    </TD>
                    <TD className="text-neutral-500 whitespace-nowrap">{c.email}</TD>
                    <TD className="text-neutral-600">{c.purchaseCount}</TD>
                    <TD className="font-semibold text-black whitespace-nowrap">{formatCurrency(c.totalSpend)}</TD>
                    <TD>
                      {activeSubs > 0
                        ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{activeSubs} active</span>
                        : <span className="text-neutral-300 text-xs">—</span>}
                    </TD>
                    <TD className="text-neutral-400 whitespace-nowrap">
                      {c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toLocaleDateString() : '—'}
                    </TD>
                    <TD className="text-right">
                      <button className="text-xs text-neutral-400 hover:text-black font-medium">View →</button>
                    </TD>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function ProductsSection() {
  const products = DEMO_PRODUCTS

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-black">Products</h1>
        <span className="text-sm text-neutral-400">{products.length} total</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr><TH>Product</TH><TH>Seller</TH><TH>Type</TH><TH>Price</TH><TH>Status</TH></tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.length === 0 && <EmptyDemo entity="products" />}
              {products.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <TD>
                    <p className="font-medium text-black">{p.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">/{p.slug}</p>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Avatar name="Alex Johnson" />
                      <span className="text-neutral-600 whitespace-nowrap">Alex Johnson</span>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded capitalize whitespace-nowrap">
                      {p.productType.replace('_', ' ')}
                    </span>
                  </TD>
                  <TD className="font-semibold text-black whitespace-nowrap">{formatCurrency(p.price)}</TD>
                  <TD>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                      {p.status}
                    </span>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
