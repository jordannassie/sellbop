'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface StripeStatus {
  connected: boolean
  onboarding_complete: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
}

async function startStripeConnect(): Promise<void> {
  const res = await fetch('/api/stripe/connect', { method: 'POST' })
  const data = await res.json()
  if (data.onboarding_url) {
    window.location.href = data.onboarding_url
  }
}

import { useUserStore } from '@/hooks/use-user-store'

export function StripePaymentsCard() {
  const { activeStoreId, storeVersion } = useUserStore()
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/connect')
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeStoreId) {
      setLoading(false)
      return
    }
    setLoading(true)
    loadStatus()
  }, [activeStoreId, storeVersion, loadStatus])

  async function handleConnect() {
    setConnecting(true)
    try {
      await startStripeConnect()
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="h-16 bg-neutral-100 rounded animate-pulse" />
      </div>
    )
  }

  const connected = status?.connected === true

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-sm sm:text-base font-bold text-black">Stripe Payments</h2>
            {connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="neutral">Not connected</Badge>
            )}
          </div>
          {connected ? (
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-600">
                Your store is ready to receive payments.
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">
              Connect your bank through Stripe to receive payouts when customers buy your digital products.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {connected ? (
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="secondary">
                Manage Stripe <ExternalLink size={13} />
              </Button>
            </a>
          ) : (
            <Button
              size="sm"
              variant="brand"
              onClick={handleConnect}
              disabled={connecting}
              className="font-semibold"
            >
              {connecting ? 'Connecting…' : 'Connect Stripe'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { startStripeConnect }
