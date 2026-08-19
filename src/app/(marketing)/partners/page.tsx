import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Check, Handshake, Store, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PartnerApplicationForm } from '@/components/marketing/partner-application-form'

export const metadata: Metadata = {
  title: 'Partners — SellBop',
  description: 'Partner with SellBop to turn your audience and expertise into premium digital products.',
}

const STEPS = [
  {
    icon: TrendingUp,
    title: 'You bring the audience',
    body: 'You already have a community, followers, customers, or expertise.',
  },
  {
    icon: Store,
    title: 'We build the products',
    body: 'SellBop helps create premium digital products and your branded digital storefront.',
  },
  {
    icon: Handshake,
    title: 'We grow together',
    body: 'Sell the products to your audience and share in the revenue.',
  },
]

export default function PartnersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          SELLBOP PARTNERS
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-[1.08] mb-5">
          Your audience. We build the products.
        </h1>
        <p className="text-neutral-500 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Partner with SellBop to turn your knowledge, audience, and brand into premium digital products.
          We can help create the products, build the storefront, handle checkout and delivery, and grow the business together.
        </p>
        <Link href="#apply">
          <Button size="lg">
            Become a Partner <ArrowDown size={16} />
          </Button>
        </Link>
        <p className="text-sm text-neutral-400 mt-5">
          You bring the audience. We help build the business.
        </p>
      </section>

      {/* 3 steps */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-neutral-200 bg-white p-7">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(0,230,118,0.12)' }}
                >
                  <step.icon size={20} style={{ color: '#00E676' }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  {index + 1}
                </p>
                <p className="text-lg font-bold text-black mb-2">{step.title}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">
            Become a SellBop Partner
          </h2>
          <p className="text-neutral-500 text-sm sm:text-base">
            Tell us a little about you and your audience.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          <PartnerApplicationForm />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-500">
          {['No account required', 'We review every application', 'Partner badge granted separately'].map(text => (
            <span key={text} className="flex items-center gap-1.5">
              <Check size={13} className="text-emerald-500" /> {text}
            </span>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-neutral-100 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-neutral-500 mb-4">Already selling on SellBop?</p>
          <Link href="/dashboard">
            <Button variant="secondary">
              Go to Dashboard <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
