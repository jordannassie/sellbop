'use client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

export default function BillingPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Billing</h1>
        <p className="text-neutral-500 text-sm mt-1">No monthly fee. You only pay when you sell.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct sales fee</CardTitle>
          <CardDescription>Applied when you share your own product page, storefront, or link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold text-black">10% + $0.50</p>
          <p className="text-sm text-neutral-500">per transaction</p>
          <ul className="space-y-2 text-sm text-neutral-600">
            {[
              'No monthly subscription required',
              'Simple sellbopng, simple pricing',
              'Built for downloads, services, and subscriptions',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check size={13} className="text-black flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-neutral-400 border-t border-neutral-100 pt-3">
            Payment processing fees may apply separately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discover marketplace fee</CardTitle>
          <CardDescription>Only when SellBop brings the customer to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold text-black">30% per transaction</p>
          <p className="text-sm text-neutral-500">
            This fee only applies when a buyer discovers your product through SellBop&apos;s future marketplace — not when you share your own links.
          </p>
          <Badge variant="neutral">Discover not live yet</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payouts &amp; tax settings</CardTitle>
          <CardDescription>Coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-500 space-y-1">
          <p>Connect your payout account and manage tax settings from here.</p>
          <p>All past transactions and fees will be visible once Stripe is connected.</p>
        </CardContent>
      </Card>
    </div>
  )
}
