import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { DEMO_PRODUCTS, DEMO_ORDERS, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Demo — Selli' }

export default function DemoPage() {
  const topProducts = DEMO_PRODUCTS.slice(0, 3)
  const recentOrders = DEMO_ORDERS.slice(0, 4)
  const totalRevenue = DEMO_ORDERS.reduce((s, o) => s + o.amount, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Live demo — real data, real UI
        </div>
        <h1 className="text-4xl font-bold text-black mb-3">See Selli in action</h1>
        <p className="text-neutral-500 text-base max-w-lg mx-auto">
          Every part of this is real and interactive. Log in with demo credentials to explore the full dashboard.
        </p>
      </div>

      {/* Demo credentials box */}
      <div className="max-w-lg mx-auto mb-12 p-5 bg-neutral-50 border border-neutral-200 rounded-2xl">
        <p className="text-sm font-semibold text-black mb-3">Demo Accounts</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-neutral-500">Creator: </span>
              <code className="text-black">creator@selli.demo</code>
              <span className="text-neutral-400"> / </span>
              <code className="text-black">demo123</code>
            </div>
            <Link href="/login"><Button size="xs">Log in →</Button></Link>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-neutral-100 pt-2">
            <div>
              <span className="text-neutral-500">Buyer: </span>
              <code className="text-black">buyer@selli.demo</code>
              <span className="text-neutral-400"> / </span>
              <code className="text-black">demo123</code>
            </div>
            <Link href="/login"><Button size="xs" variant="secondary">Log in →</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Dashboard mockup */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-neutral-900 text-white px-2 py-1 rounded">Creator Dashboard</span>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex">
              <div className="w-36 bg-neutral-50 border-r border-neutral-100 p-3 min-h-80">
                <p className="text-xs font-bold text-black px-2 py-2">Selli</p>
                {['Overview', 'Products', 'Orders', 'Customers', 'Analytics', 'Discounts', 'Payouts', 'Settings'].map((item, i) => (
                  <div key={item} className={`px-2 py-1.5 rounded-md text-xs mb-0.5 ${i === 0 ? 'bg-black text-white font-medium' : 'text-neutral-500'}`}>{item}</div>
                ))}
              </div>
              <div className="flex-1 p-4">
                <p className="text-sm font-semibold text-black mb-3">Overview</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { l: 'Total Revenue', v: formatCurrency(totalRevenue) },
                    { l: 'Total Sales', v: DEMO_ORDERS.length.toString() },
                    { l: 'Products', v: DEMO_PRODUCTS.length.toString() },
                    { l: 'Customers', v: '10' },
                  ].map(s => (
                    <div key={s.l} className="bg-neutral-50 rounded-lg p-2.5">
                      <p className="text-xs text-neutral-400 mb-0.5">{s.l}</p>
                      <p className="text-sm font-bold text-black">{s.v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-neutral-600 mb-2">Recent Orders</p>
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0">
                    <span className="text-xs text-neutral-500 truncate max-w-[120px]">{o.customerEmail}</span>
                    <span className="text-xs font-semibold text-black">{formatCurrency(o.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link href="/login" className="block mt-3">
            <Button className="w-full" variant="secondary">→ Open full dashboard</Button>
          </Link>
        </div>

        {/* Sell page preview */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded">Public Sell Page</span>
            <span className="text-xs text-neutral-400">/p/notion-template-pack</span>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-40 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <span className="text-5xl opacity-30">📄</span>
            </div>
            <div className="p-6">
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">Digital Download</span>
              <h2 className="text-xl font-bold text-black mt-2 mb-2">Notion Template Pack</h2>
              <p className="text-sm text-neutral-500 mb-4">50+ premium Notion templates for productivity, projects, and life systems.</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-black">$29</span>
                  <span className="text-neutral-400 text-sm ml-1.5 line-through">$49</span>
                </div>
                <div className="bg-black text-white text-sm font-medium px-5 py-2 rounded-lg">Get Instant Access</div>
              </div>
              <p className="text-xs text-neutral-400 mt-3 text-center">Sold by {DEMO_SELLER_PROFILE.displayName}</p>
            </div>
          </div>
          <Link href="/p/notion-template-pack" className="block mt-3">
            <Button className="w-full" variant="secondary">→ View live sell page</Button>
          </Link>
        </div>
      </div>

      {/* Products grid */}
      <div className="mt-14">
        <h2 className="text-lg font-semibold text-black mb-6">Demo products (click to view live pages)</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {topProducts.map(p => (
            <Link key={p.id} href={`/p/${p.slug}`}>
              <div className="border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white group">
                <span className="text-xs text-neutral-400 capitalize">{p.productType.replace('_', ' ')}</span>
                <p className="font-semibold text-sm text-black mt-1 mb-2 group-hover:underline">{p.name}</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-black">{formatCurrency(p.price)}</span>
                  <span className="text-xs text-neutral-400">{p.salesCount} sales</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/store/alexjohnson"><Button variant="ghost" size="sm">View all products in the demo store →</Button></Link>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-14 bg-neutral-50 border border-neutral-200 rounded-2xl py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-black mb-2">Ready to build your store?</h2>
        <p className="text-neutral-500 text-sm mb-6">Everything you just saw is real. Your store can look exactly like this.</p>
        <Link href="/signup"><Button size="lg">Create Your Account</Button></Link>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5">
          {['No credit card required', 'Demo mode available', 'Set up in 5 minutes'].map(t => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Check size={11} className="text-neutral-400" />{t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
