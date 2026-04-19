'use client'
import { useState } from 'react'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$19/mo', features: ['Up to 3 products', 'Basic storefront', 'Stripe checkout', 'File delivery', 'Basic analytics'] },
  { id: 'pro', name: 'Pro', price: '$49/mo', features: ['Unlimited products', 'Custom branding', 'Discount codes', 'Advanced analytics', 'Priority support'] },
]

export default function BillingPage() {
  const [plan, setPlan] = useState(DEMO_SELLER_PROFILE.plan)

  function handleUpgrade(planId: string) {
    alert(`Demo: Would redirect to Stripe Checkout for ${planId} plan.`)
    setPlan(planId as typeof plan)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Billing</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your Selli subscription.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">Current plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-black capitalize">{plan}</span>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => alert('Demo: Would open Stripe Customer Portal for billing management.')}>
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {PLANS.map(p => (
          <div key={p.id} className={`rounded-2xl border p-6 ${plan === p.id ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-medium ${plan === p.id ? 'text-neutral-400' : 'text-neutral-500'}`}>{p.name}</p>
                <p className="text-2xl font-bold mt-0.5">{p.price}</p>
              </div>
              {plan === p.id && <Badge variant="success">Current</Badge>}
            </div>
            <ul className="space-y-2 mb-5">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={13} className="flex-shrink-0" />
                  <span className={plan === p.id ? 'text-neutral-300' : 'text-neutral-700'}>{f}</span>
                </li>
              ))}
            </ul>
            {plan !== p.id && (
              <Button onClick={() => handleUpgrade(p.id)} className="w-full" variant="secondary">
                Upgrade to {p.name}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
