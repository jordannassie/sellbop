import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy — SellBop',
  description: 'SellBop refund and dispute policy for buyers and creators.',
}

export default function RefundPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Legal</p>
      <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">Refund Policy</h1>
      <p className="text-neutral-500 text-sm mb-10">Last updated: May 2026</p>

      <div className="prose prose-sm prose-neutral max-w-none space-y-8 text-neutral-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Overview</h2>
          <p>
            SellBop is a platform that enables creators to sell digital products, subscriptions, coaching, and other
            offerings directly to buyers. Because most products sold on SellBop are digital and delivered immediately
            upon purchase, all sales are generally final.
          </p>
          <p className="mt-3">
            However, we want every buyer to have a fair experience. If you believe you were charged in error, received
            a defective product, or experienced another legitimate issue, please contact us or the creator directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Creator Responsibility</h2>
          <p>
            Creators are responsible for clearly describing their products, pricing, and what buyers receive.
            If a product significantly differs from its description, buyers may be entitled to a refund at the
            creator&apos;s discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Platform Fees</h2>
          <p>
            SellBop does not collect platform fees during the current beta period. Standard Stripe/payment
            processing fees are non-refundable as they are collected directly by the payment processor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Subscriptions</h2>
          <p>
            Subscription purchases can be cancelled at any time. Cancellation takes effect at the end of the
            current billing period. Partial-period refunds are not available unless required by law or granted
            by the creator.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Disputes & Chargebacks</h2>
          <p>
            If you have a dispute with a creator, please contact them first. If you cannot resolve it,
            contact SellBop Support and we will investigate. Initiating a chargeback without contacting us
            first may result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-black mb-2">Contact</h2>
          <p>
            For refund requests or disputes, contact us at{' '}
            <a href="mailto:support@sellbop.com" className="text-black underline underline-offset-2">
              support@sellbop.com
            </a>
            {' '}or visit our{' '}
            <Link href="/support" className="text-black underline underline-offset-2">Support page</Link>.
          </p>
        </section>

      </div>
    </main>
  )
}
