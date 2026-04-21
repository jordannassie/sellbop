import Link from 'next/link'

export const metadata = {
  title: 'Pricing — SellBop.com',
  description: 'No monthly fees. Only pay when you sell.',
}

const faq = [
  { q: 'Do I pay monthly?', a: 'No. SellBop only charges when you make a sale.' },
  { q: 'What is the direct sales fee?', a: '10% + $0.50 per transaction when you share your own sell page or storefront.' },
  { q: 'When does the 30% fee apply?', a: 'Only when SellBop brings the customer through a future discover marketplace.' },
  { q: 'Are payment processing fees included?', a: 'No. Payment processing fees may apply separately through Stripe.' },
]

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 space-y-12">
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 font-medium">Transparent</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-black">Simple, transparent pricing</h1>
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
          No monthly fees. Only pay when you sell. Keep more of your revenue than complicated all-in-one tools.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,0.6fr] gap-6 items-start">
        {/* Main pricing block */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-[0.4em] font-medium mb-3">Direct sales</p>
            <p className="text-5xl sm:text-6xl font-bold text-black leading-none">10% + $0.50</p>
            <p className="text-base text-neutral-500 mt-1">per direct sale</p>
          </div>
          <p className="text-neutral-600">
            Sell downloads, services, subscriptions, and media packs. Only pay when a buyer completes a purchase.
          </p>
          <ul className="space-y-3 text-sm text-neutral-600">
            {[
              'No monthly fee to get started',
              'Simple sellbopng, simple pricing',
              'Built for creators sellbopng downloads, services, and subscriptions',
              'Keep more of your revenue than complicated all-in-one tools',
              'Payment processing fees may apply separately',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black/60 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/login">
            <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
              Start sellbopng free →
            </span>
          </Link>
        </div>

        {/* Discover note */}
        <div className="bg-neutral-900 text-white rounded-3xl p-7 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-400 font-medium">Discover / marketplace</p>
          <p className="text-3xl font-bold">30%</p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Only when SellBop brings the customer to you through a future discover marketplace. Not the default fee.
          </p>
          <p className="text-xs text-neutral-500">Coming soon — discover is not live yet.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold text-black">Common questions</h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          {faq.map((item) => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-medium text-black">{item.q}</p>
              <p className="text-sm text-neutral-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
