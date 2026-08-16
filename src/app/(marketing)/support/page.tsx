import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Support — Sellbop',
  description: 'Get help with Sellbop.',
}

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-black mb-2">Support</h1>
      <p className="text-neutral-500 text-base mb-10">
        Have a question or need help? We&rsquo;re here for you.
      </p>

      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-black mb-2">Email Support</h2>
          <p className="text-neutral-600 text-sm mb-4">
            For account issues, billing questions, or anything else — email our support team.
          </p>
          <a href="mailto:support@sellbop.com">
            <Button>Email support@sellbop.com</Button>
          </a>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-bold text-black mb-2">Common questions</h2>
          <div className="space-y-4 text-sm text-neutral-600">
            <div>
              <p className="font-medium text-black">How do I create a product?</p>
              <p className="mt-1">Log in to your dashboard and click &ldquo;Create Product.&rdquo; Upload your file, set a price, and publish.</p>
            </div>
            <div>
              <p className="font-medium text-black">When do I get paid?</p>
              <p className="mt-1">Connect your Stripe account in Settings → Payments. Stripe handles payouts directly to your bank.</p>
            </div>
            <div>
              <p className="font-medium text-black">How do buyers download my product?</p>
              <p className="mt-1">After purchase, buyers receive a secure download link. For free products, they enter their email and get access immediately.</p>
            </div>
            <div>
              <p className="font-medium text-black">What file types can I sell?</p>
              <p className="mt-1">PDFs, ZIPs, spreadsheets, images, audio files, videos, and more. Max 100 MB per file.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link href="/" className="text-sm text-neutral-500 hover:text-black transition-colors">
            ← Back to Sellbop
          </Link>
        </div>
      </div>
    </div>
  )
}
