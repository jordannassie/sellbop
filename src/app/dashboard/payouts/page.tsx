'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ExternalLink } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'
import { formatCurrency } from '@/lib/utils'

const STRIPE_LOGO_URL =
  'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Stripe_Logo,_revised_2016.svg.webp'

function StripeLogo({ className = 'h-6' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={STRIPE_LOGO_URL}
      alt="Stripe"
      className={`w-auto object-contain ${className}`}
    />
  )
}

interface StripeStatus {
  connected: boolean
  onboarding_complete: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
}

interface OrderRow {
  id: string
  total_cents: number
  platform_fee_cents: number
  payment_status: string
  created_at: string
}

export default function PayoutsPage() {
  const { session } = useAuth()
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!session || !isSupabaseConfigured()) { setLoading(false); return }
    Promise.all([
      fetch('/api/stripe/connect').then(r => r.ok ? r.json() : null),
      fetch('/api/orders').then(r => r.ok ? r.json() : { orders: [] }),
    ]).then(([stripe, ordersData]) => {
      setStripeStatus(stripe)
      setOrders(ordersData.orders ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [session])

  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  const grossRevenue = paidOrders.reduce((s, o) => s + (o.total_cents ?? 0), 0) / 100
  const platformFees = paidOrders.reduce((s, o) => s + (o.platform_fee_cents ?? 0), 0) / 100
  const netRevenue = grossRevenue - platformFees

  async function handleConnectStripe() {
    setConnecting(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url
      }
    } catch {
      // noop
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Payouts</h1>
        <p className="mt-1 text-sm text-neutral-500">Connect Stripe to receive your earnings directly.</p>
      </div>

      {/* Stripe connection card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Stripe Connection</CardTitle>
            <StripeLogo className="h-7" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-16 bg-neutral-100 rounded animate-pulse" />
          ) : stripeStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                {stripeStatus.charges_enabled && <Badge variant="success">Charges enabled</Badge>}
                {stripeStatus.payouts_enabled && <Badge variant="success">Payouts enabled</Badge>}
              </div>
              <p className="text-sm text-neutral-600">
                Your Stripe account is connected. Payouts will be sent automatically by Stripe.
              </p>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black transition-colors"
              >
                Open Stripe Dashboard <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">Not connected</Badge>
              </div>
              <p className="text-sm text-neutral-600">
                Connect your Stripe account to start accepting payments and receive payouts.
                Sellbop uses Stripe Connect to securely transfer your earnings directly to your bank.
              </p>
              <Button onClick={handleConnectStripe} loading={connecting}>
                Connect Stripe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gross Revenue', value: formatCurrency(grossRevenue), icon: DollarSign },
          { label: 'Platform Fees', value: formatCurrency(platformFees), icon: DollarSign },
          { label: 'Your Net', value: formatCurrency(netRevenue), icon: DollarSign, highlight: true },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-5 ${stat.highlight ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white'}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.highlight ? 'text-white/60' : 'text-neutral-400'} />
              <p className={`text-xs ${stat.highlight ? 'text-white/60' : 'text-neutral-500'}`}>{stat.label}</p>
            </div>
            {loading ? (
              <div className={`h-7 w-24 rounded animate-pulse ${stat.highlight ? 'bg-white/20' : 'bg-neutral-100'}`} />
            ) : (
              <p className={`text-2xl font-bold ${stat.highlight ? 'text-white' : 'text-black'}`}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        <strong className="text-neutral-700">How it works:</strong> After connecting Stripe, customers pay through Stripe Checkout.
        Sellbop deducts its platform fee and transfers the remainder to your connected Stripe account automatically.
        You manage your own payout schedule in the Stripe dashboard.
        <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-2">
          <span className="text-neutral-500">Payments powered by</span>
          <StripeLogo className="h-5" />
        </div>
      </div>
    </div>
  )
}
