import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export const metadata = { title: 'Pricing — Selli' }

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">Simple pricing</h1>
        <p className="text-neutral-500 text-base max-w-md mx-auto">No percentage cuts. No transaction fees. You keep every dollar you earn.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { name: 'Free', price: '$0', period: '', description: 'Get started for free.', features: ['1 product page', 'Basic sell page', 'Demo checkout', 'Selli branding'], cta: 'Start Free', href: '/signup', dark: false, highlight: false },
          { name: 'Starter', price: '$19', period: '/mo', description: 'Perfect for starting out.', features: ['Up to 3 products', 'Custom sell pages', 'Stripe checkout', 'File delivery', 'Order dashboard', 'Basic analytics', 'Coupon codes'], cta: 'Get Starter', href: '/signup', dark: false, highlight: true },
          { name: 'Pro', price: '$49', period: '/mo', description: 'For serious creators.', features: ['Unlimited products', 'Custom branding', 'Advanced analytics', 'Customer management', 'Membership features', 'Priority support', 'Everything in Starter'], cta: 'Get Pro', href: '/signup', dark: true, highlight: false },
        ].map(plan => (
          <div key={plan.name} className={`rounded-2xl p-7 ${plan.dark ? 'bg-black text-white' : plan.highlight ? 'border-2 border-black bg-white' : 'bg-white border border-neutral-200'}`}>
            {plan.highlight && <p className="text-xs bg-black text-white px-2 py-0.5 rounded font-medium mb-4 inline-block">Most Popular</p>}
            <p className={`text-sm font-medium mb-1 ${plan.dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{plan.name}</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className={`text-sm ${plan.dark ? 'text-neutral-400' : 'text-neutral-400'}`}>{plan.period}</span>
            </div>
            <p className={`text-xs mb-6 ${plan.dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{plan.description}</p>
            <ul className="space-y-2.5 mb-7">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={13} className="mt-0.5 flex-shrink-0" />
                  <span className={plan.dark ? 'text-neutral-200' : 'text-neutral-700'}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="block">
              <Button className={`w-full ${plan.dark ? 'bg-white text-black hover:bg-neutral-100' : ''}`} variant={plan.dark ? 'primary' : 'secondary'}>{plan.cta}</Button>
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-16 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-black mb-6 text-center">Common questions</h2>
        <div className="space-y-5">
          {[
            { q: 'Do you take a cut of my sales?', a: 'No. Selli charges a flat monthly fee. You keep 100% of your revenue (minus standard Stripe processing fees of ~2.9% + 30¢).' },
            { q: 'What payment processors are supported?', a: 'Stripe is the primary payment processor. You need your own Stripe account — payments go directly to you.' },
            { q: 'Can I sell subscriptions?', a: 'Yes. Selli supports one-time payments, subscriptions, and bundles. Subscription management is built in.' },
            { q: 'What file types can I sell?', a: 'Any file type — PDFs, ZIP files, videos, audio, software, and more. Files are delivered securely after purchase.' },
            { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime from your billing dashboard. Your pages stay active until the end of your billing period.' },
          ].map(item => (
            <div key={item.q} className="border-b border-neutral-100 pb-5">
              <p className="font-medium text-black text-sm mb-1.5">{item.q}</p>
              <p className="text-sm text-neutral-500">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
