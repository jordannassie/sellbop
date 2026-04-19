import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Download, CreditCard, Link as LinkIcon, LayoutDashboard, Zap, Users, BarChart3 } from 'lucide-react'
import { DEMO_PRODUCTS } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'

export default function HomePage() {
  const featured = DEMO_PRODUCTS.filter(p => p.status === 'published').slice(0, 3)
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Demo mode — try everything right now
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold text-black tracking-tight leading-[1.05] mb-6">
          Sell anything.<br />Keep everything.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-xl mx-auto mb-10">
          Create beautiful sell pages for digital downloads, coaching, subscriptions, and memberships. Get paid instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup"><Button size="lg">Start Free</Button></Link>
          <Link href="/demo"><Button size="lg" variant="secondary">See Demo</Button></Link>
        </div>
        <p className="text-xs text-neutral-400 mt-4">Demo accounts available · No credit card required</p>
      </section>

      {/* Live product preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {featured.map(p => (
            <Link key={p.id} href={`/p/${p.slug}`}>
              <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-3xl opacity-30">
                    {p.productType === 'digital_download' ? '📄' : p.productType === 'service_offer' ? '🎯' : p.productType === 'subscription' ? '♻️' : '📦'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mb-1 capitalize">{p.productType.replace('_', ' ')}</p>
                <p className="font-semibold text-black text-sm mb-2 group-hover:underline underline-offset-2">{p.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">{formatCurrency(p.price, p.currency)}</span>
                  {p.compareAtPrice && (
                    <span className="text-xs text-neutral-400 line-through">{formatCurrency(p.compareAtPrice)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-400 mt-4">
          <Link href="/store/alexjohnson" className="hover:text-neutral-700 underline underline-offset-2">View the full demo store →</Link>
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-3">Everything you need to sell</h2>
            <p className="text-neutral-500 text-base max-w-md mx-auto">Powerful engine, simple surface. No bloat, no complexity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <LayoutDashboard size={18} />, title: 'Full Dashboard', desc: 'Products, orders, customers, analytics, payouts — all in one place.' },
              { icon: <CreditCard size={18} />, title: 'Flexible Checkout', desc: 'One-time, subscription, bundle. Coupon codes. Tax-ready.' },
              { icon: <Download size={18} />, title: 'Secure Delivery', desc: 'Expiring download links. Access limits. License keys ready.' },
              { icon: <LinkIcon size={18} />, title: 'Your Store', desc: 'Public storefront at your own URL. Share your whole catalog.' },
              { icon: <Users size={18} />, title: 'Customer Management', desc: 'Full customer records, spend history, and purchase tracking.' },
              { icon: <BarChart3 size={18} />, title: 'Analytics', desc: 'Views, checkout starts, conversions, revenue over time.' },
              { icon: <Zap size={18} />, title: 'Coupon Engine', desc: 'Percent or fixed discounts. Usage limits. Expiry dates.' },
              { icon: <Check size={18} />, title: 'No Platform Cut', desc: 'Flat monthly fee. Keep 100% of your sales revenue.' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="text-black mb-3">{f.icon}</div>
                <p className="font-semibold text-black text-sm mb-1">{f.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-3">Four steps to selling</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { n: '01', t: 'Create your product', d: 'Name, price, description, upload your file or add a booking link.' },
              { n: '02', t: 'Publish your page', d: 'Your sell page goes live at /p/your-slug. Share it anywhere.' },
              { n: '03', t: 'Buyer checks out', d: 'Clean checkout with coupon support and instant confirmation.' },
              { n: '04', t: 'You get paid', d: 'Files deliver automatically. Revenue hits your dashboard instantly.' },
            ].map(s => (
              <div key={s.n}>
                <span className="text-xs font-mono text-neutral-400 font-medium">{s.n}</span>
                <h3 className="font-semibold text-black mt-2 mb-1.5 text-sm">{s.t}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-2">Simple pricing</h2>
            <p className="text-neutral-500 text-sm">No platform cuts. No hidden fees.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { name: 'Starter', price: '$19', period: '/mo', features: ['Up to 3 products', 'Basic storefront', 'Stripe checkout', 'File delivery', 'Order dashboard', 'Basic analytics'], cta: 'Get Started', dark: false },
              { name: 'Pro', price: '$49', period: '/mo', features: ['Unlimited products', 'Custom branding', 'Discount codes', 'Advanced analytics', 'Priority support', 'Memberships ready'], cta: 'Get Pro', dark: true },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 ${plan.dark ? 'bg-black text-white' : 'bg-white border border-neutral-200'}`}>
                <p className={`text-sm font-medium mb-1 ${plan.dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.dark ? 'text-neutral-400' : 'text-neutral-400'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={13} className="flex-shrink-0" />
                      <span className={plan.dark ? 'text-neutral-200' : 'text-neutral-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <Button className={`w-full ${plan.dark ? 'bg-white text-black hover:bg-neutral-100' : ''}`} variant={plan.dark ? 'primary' : 'secondary'}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">Start selling today</h2>
          <p className="text-neutral-500 mb-8">Demo accounts are ready. Log in and explore everything.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"><Button size="lg">Try Demo</Button></Link>
            <Link href="/pricing"><Button size="lg" variant="secondary">See Pricing</Button></Link>
          </div>
          <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-xl inline-block text-left mx-auto">
            <p className="text-xs text-neutral-500 font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-neutral-700">Creator: <code className="bg-neutral-100 px-1 rounded">creator@selli.demo</code> / <code className="bg-neutral-100 px-1 rounded">demo123</code></p>
            <p className="text-xs text-neutral-700 mt-0.5">Buyer: <code className="bg-neutral-100 px-1 rounded">buyer@selli.demo</code> / <code className="bg-neutral-100 px-1 rounded">demo123</code></p>
          </div>
        </div>
      </section>
    </>
  )
}
