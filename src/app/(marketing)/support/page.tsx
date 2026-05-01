import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support — SellBop',
  description: 'Get help with your SellBop account, products, or purchases.',
}

export default function SupportPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Help</p>
      <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">Support</h1>
      <p className="text-neutral-500 text-sm mb-10">
        We&apos;re here to help. Whether you&apos;re a creator or a buyer, reach out and we&apos;ll get back to you quickly.
      </p>

      <div className="space-y-6">

        <div className="bg-white border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-black mb-1">Email Support</h2>
          <p className="text-sm text-neutral-500 mb-3">
            For account issues, purchase questions, refund requests, or general help.
          </p>
          <a
            href="mailto:support@sellbop.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            support@sellbop.com
          </a>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-black mb-1">Creator Support</h2>
          <p className="text-sm text-neutral-500 mb-3">
            Questions about setting up your store, products, or payouts? We&apos;re here to help you launch faster.
          </p>
          <a
            href="mailto:creators@sellbop.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            creators@sellbop.com
          </a>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6">
          <h2 className="text-base font-bold text-black mb-1">Response Times</h2>
          <ul className="space-y-1 text-sm text-neutral-500 mt-2">
            <li>• General support: within 24–48 hours</li>
            <li>• Urgent/billing issues: within 12 hours</li>
            <li>• Beta period: response times may vary</li>
          </ul>
        </div>

      </div>
    </main>
  )
}
