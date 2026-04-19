export const metadata = { title: 'Terms of Service — Selli' }
export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Terms of Service</h1>
      <p className="text-neutral-500 text-sm mb-8">Last updated: April 2025</p>
      <div className="space-y-5 text-sm text-neutral-700">
        <p>By using Selli, you agree to these terms. Selli is a platform for creating and selling digital products.</p>
        <h2 className="text-base font-semibold text-black">Acceptable Use</h2>
        <p>You may not use Selli to sell illegal products, infringe intellectual property, or engage in fraud or spam.</p>
        <h2 className="text-base font-semibold text-black">Payments</h2>
        <p>Payments are processed by Stripe. Selli does not store card details. Payouts are governed by your Stripe account terms.</p>
        <h2 className="text-base font-semibold text-black">Termination</h2>
        <p>We reserve the right to suspend accounts that violate these terms without notice.</p>
        <h2 className="text-base font-semibold text-black">Contact</h2>
        <p>Questions? Email hello@selli.app</p>
      </div>
    </div>
  )
}
