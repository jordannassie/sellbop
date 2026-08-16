export const metadata = {
  title: 'Privacy Policy — Sellbop',
  description: 'Privacy Policy for Sellbop.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Privacy Policy</h1>
      <p className="text-neutral-500 text-sm mb-10">Last updated: {new Date().getFullYear()}</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
        <section>
          <h2 className="text-xl font-bold text-black mb-3">What we collect</h2>
          <p>We collect information you provide when creating an account (name, email), information about your products and sales, and technical data necessary to operate the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">How we use your data</h2>
          <p>We use your data to operate Sellbop, process payments, deliver products to buyers, communicate important account information, and improve our service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Third parties</h2>
          <p>We use Supabase for database and authentication, Stripe for payment processing, and standard hosting infrastructure. These services have their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Data security</h2>
          <p>We take reasonable measures to protect your data. Product files are stored privately and delivered via secure signed URLs. Payment data is processed by Stripe and never stored on Sellbop servers.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Your rights</h2>
          <p>You can request deletion of your account and data by emailing <a href="mailto:support@sellbop.com" className="text-black underline">support@sellbop.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-3">Contact</h2>
          <p>Questions about privacy? Email <a href="mailto:support@sellbop.com" className="text-black underline">support@sellbop.com</a>.</p>
        </section>
      </div>
    </div>
  )
}
