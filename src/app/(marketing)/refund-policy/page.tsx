export const metadata = {
  title: 'Refund Policy — Sellbop',
  description: 'Refund Policy for Sellbop.',
}

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Refund Policy</h1>
      <p className="text-neutral-500 text-sm mb-10">Last updated: {new Date().getFullYear()}</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
        <section>
          <h2 className="text-xl font-bold text-black mb-3">Creator responsibility</h2>
          <p>Each seller on Sellbop sets their own refund policy. When purchasing a digital product, check the product page for the seller&rsquo;s specific refund terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Digital products</h2>
          <p>Because digital products can be downloaded immediately after purchase, refunds may not always be available. This is at the seller&rsquo;s discretion.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Disputes</h2>
          <p>If you have a dispute with a seller, first contact the seller directly using their support email. If the issue cannot be resolved, contact us at <a href="mailto:support@sellbop.com" className="text-black underline">support@sellbop.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Platform fees</h2>
          <p>Sellbop platform fees are non-refundable in cases of fraudulent purchases or policy violations.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Contact</h2>
          <p>Questions? Email <a href="mailto:support@sellbop.com" className="text-black underline">support@sellbop.com</a>.</p>
        </section>
      </div>
    </div>
  )
}
