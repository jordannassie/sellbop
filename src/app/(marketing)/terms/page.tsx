export const metadata = {
  title: 'Terms of Service — Sellbop',
  description: 'Terms of Service for Sellbop.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Terms of Service</h1>
      <p className="text-neutral-500 text-sm mb-10">Last updated: {new Date().getFullYear()}</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
        <section>
          <h2 className="text-xl font-bold text-black mb-3">1. About Sellbop</h2>
          <p>Sellbop is a platform that enables sellers (&ldquo;Creators&rdquo;) to sell digital products directly to buyers. By using Sellbop, you agree to these terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">2. Accounts</h2>
          <p>You must provide accurate information when creating an account. You are responsible for all activity under your account. You must be at least 18 years old to sell on Sellbop.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">3. Sellers</h2>
          <p>Creators are solely responsible for the products they sell, including accuracy, legality, and delivery. Creators must not sell prohibited products (see our Acceptable Use Policy).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">4. Payments</h2>
          <p>Payments are processed through Stripe. Creators connect their own Stripe accounts and receive payouts directly. Sellbop charges a platform fee on each transaction. Creators are responsible for all applicable taxes on their earnings.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">5. Digital Products</h2>
          <p>Digital products are delivered electronically. Once a buyer downloads a product, it is considered delivered. Refund policies are set by each individual Creator.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">6. Prohibited Content</h2>
          <p>You may not sell illegal content, content that violates intellectual property rights, adult content, or anything violating our Acceptable Use Policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">7. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">8. Limitation of Liability</h2>
          <p>Sellbop is not liable for disputes between buyers and sellers, product quality, or tax obligations. The platform is provided &ldquo;as is.&rdquo;</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">9. Contact</h2>
          <p>Questions? Email us at <a href="mailto:support@sellbop.com" className="text-black underline">support@sellbop.com</a>.</p>
        </section>
      </div>
    </div>
  )
}
