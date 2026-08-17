'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startStripeConnect } from '@/components/dashboard/stripe-payments-card'

export function StripeLiveProductsWarning({ liveProductCount }: { liveProductCount: number }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (liveProductCount === 0) return
    fetch('/api/stripe/connect')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setConnected(data?.connected === true))
      .catch(() => setConnected(false))
  }, [liveProductCount])

  if (liveProductCount === 0 || connected === null || connected) return null

  async function handleConnect() {
    setConnecting(true)
    try {
      await startStripeConnect()
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-700">
            Your products are live, but you still need to connect Stripe to receive payouts.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={connecting}
          className="flex-shrink-0 font-bold text-white hover:opacity-90"
          style={{ background: '#00E676', borderColor: '#00E676' }}
        >
          {connecting ? 'Connecting…' : 'Connect Stripe'}
        </Button>
      </div>
    </div>
  )
}
