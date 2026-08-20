'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sellbopShareBps } from '@/lib/payments/partner-allocation'

interface PartnerTermsAcceptanceProps {
  partnershipId: string
  partnerShareBps: number
  termsAccepted: boolean
}

export function PartnerTermsAcceptance({
  partnershipId,
  partnerShareBps,
  termsAccepted,
}: PartnerTermsAcceptanceProps) {
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(termsAccepted)
  const [error, setError] = useState<string | null>(null)

  if (accepted) return null

  async function accept() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/partnerships/accept-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnershipId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not accept terms.')
      return
    }
    setAccepted(true)
  }

  const sellbopBps = sellbopShareBps(partnerShareBps)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6">
      <h2 className="text-lg font-semibold text-amber-950">Partnership Revenue Share</h2>
      <p className="text-sm text-amber-900 mt-2">
        Partner: <strong>{partnerShareBps / 100}%</strong> · SellBop: <strong>{sellbopBps / 100}%</strong>
      </p>
      <p className="text-xs text-amber-800 mt-2 max-w-xl">
        Calculated from net distributable revenue after applicable affiliate commission and payment processing fees.
      </p>
      <Button className="mt-4" onClick={accept} loading={loading}>
        Accept Revenue Share
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
