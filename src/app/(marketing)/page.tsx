import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/product-image'
import { RotatingWord } from '@/components/marketing/rotating-word'
import { StrategyCallSection } from '@/components/marketing/strategy-call-section'
import { Check, Download, CreditCard, Link as LinkIcon, LayoutDashboard, Zap, Users, BarChart3, PackagePlus, Globe, ShoppingCart, Banknote } from 'lucide-react'
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
        <h1 className="text-5xl sm:text-7xl font-bold text-black tracking-tight leading-[1.15] mb-6">
          Sell <RotatingWord />.<br />Keep everything.
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

      {/* Hero photo */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl">
          <Image
            src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/Selli/image/alluring_swan_07128_High-converting_social_media_ad_image_for_afc80697-1416-4101-93bb-6d858068f98c_0.png"
            alt="Sell anything in minutes with SellBop.com"
            width={1400}
            height={700}
            className="w-full object-cover"
            priority
          />
        </div>
      </section>

      {/* Live product preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featured.map(p => (
            <Link key={p.id} href={`/p/${p.slug}`}>
              <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="aspect-video rounded-lg mb-4 overflow-hidden relative">
                  <ProductImage src={p.thumbnailUrl} alt={p.name} productType={p.productType} fill iconSize="md" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-3">Four steps to selling</h2>
            <p className="text-neutral-500 text-base max-w-sm mx-auto">From idea to paid in minutes. No complicated setup.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            {[
              { n: '01', icon: <PackagePlus size={28} />, t: 'Create your product', d: 'Name, price, description, upload your file or add a booking link.', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', numColor: 'text-violet-400' },
              { n: '02', icon: <Globe size={28} />, t: 'Publish your page', d: 'Your sell page goes live instantly. Share the link anywhere.', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', numColor: 'text-blue-400' },
              { n: '03', icon: <ShoppingCart size={28} />, t: 'Buyer checks out', d: 'Clean checkout with coupon support and instant confirmation.', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', numColor: 'text-emerald-400' },
              { n: '04', icon: <Banknote size={28} />, t: 'You get paid', d: 'Files deliver automatically. Revenue hits your dashboard instantly.', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', numColor: 'text-amber-400' },
            ].map(s => (
              <div key={s.n} className="flex flex-col items-start">
                {/* Big number */}
                <span className={`text-5xl sm:text-6xl font-black leading-none mb-4 ${s.numColor} select-none`}>{s.n}</span>
                {/* Icon circle */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${s.iconBg} ${s.iconColor} flex items-center justify-center mb-4`}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-black mb-2 text-sm sm:text-base leading-tight">{s.t}</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-2">Simple, transparent pricing</h2>
            <p className="text-neutral-500 text-base">No monthly fees. Only pay when you sell.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5">
            <p className="text-xs text-neutral-500 uppercase tracking-[0.4em] font-medium">Direct sales</p>
            <p className="text-4xl sm:text-5xl font-bold text-black">10% + $0.50 per sale</p>
            <p className="text-neutral-600">
              Simple sellbopng, simple pricing. Built for creators sellbopng downloads, services, and subscriptions.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm text-neutral-600">
              {[
                'No monthly fee to get started',
                'Keep more of your revenue',
                'Every product type supported',
                'Payment processing fees may apply',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black/60 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-400 border-t border-neutral-100 pt-4">
              Discover/marketplace sales (only when SellBop brings the customer): 30% per transaction.
            </p>
          </div>
          <p className="text-center text-xs text-neutral-400 mt-5">
            <Link href="/pricing" className="underline underline-offset-2 hover:text-neutral-600">View the full pricing model →</Link>
          </p>
        </div>
      </section>

      {/* Strategy Call */}
      <StrategyCallSection />

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">Start sellbopng today</h2>
          <p className="text-neutral-500 mb-8">Demo accounts are ready. Log in and explore everything.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"><Button size="lg">Try Demo</Button></Link>
            <Link href="/pricing"><Button size="lg" variant="secondary">See Pricing</Button></Link>
          </div>
          <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-xl inline-block text-left mx-auto">
            <p className="text-xs text-neutral-500 font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-neutral-700">Creator: <code className="bg-neutral-100 px-1 rounded">creator@sellbop.demo</code> / <code className="bg-neutral-100 px-1 rounded">demo123</code></p>
            <p className="text-xs text-neutral-700 mt-0.5">Buyer: <code className="bg-neutral-100 px-1 rounded">buyer@sellbop.demo</code> / <code className="bg-neutral-100 px-1 rounded">demo123</code></p>
          </div>
        </div>
      </section>
    </>
  )
}
