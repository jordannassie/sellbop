export const metadata = { title: 'Privacy Policy — Selli' }
export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Privacy Policy</h1>
      <p className="text-neutral-500 text-sm mb-8">Last updated: April 2025</p>
      <div className="space-y-5 text-sm text-neutral-700">
        <p>Selli is committed to protecting your privacy. This policy explains what data we collect and how we use it.</p>
        <h2 className="text-base font-semibold text-black">Data We Collect</h2>
        <p>We collect your email, name, and billing information. We also collect information about your products and orders to provide the service.</p>
        <h2 className="text-base font-semibold text-black">How We Use It</h2>
        <p>We use your data to operate Selli, process payments via Stripe, and communicate with you about your account.</p>
        <h2 className="text-base font-semibold text-black">Third Parties</h2>
        <p>We use Stripe for payments and Supabase for infrastructure. We do not sell your data.</p>
        <h2 className="text-base font-semibold text-black">Contact</h2>
        <p>Questions? Email hello@selli.app</p>
      </div>
    </div>
  )
}
