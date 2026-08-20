'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sellbopShareBps } from '@/lib/payments/partner-allocation'
import { formatCurrency } from '@/lib/utils'

const SHARE_PRESETS = [3000, 4000, 5000, 6000, 7000]

interface LaunchChecklist {
  partnerClaimed: boolean
  revenueShareAccepted: boolean
  stripeConnected: boolean
  payoutsEnabled: boolean
  chargesEnabled: boolean
  hasLiveProduct: boolean
  canActivate: boolean
  blockers: string[]
}

export function PartnershipDetailClient({ partnershipId }: { partnershipId: string }) {
  const router = useRouter()
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [checklist, setChecklist] = useState<LaunchChecklist | null>(null)
  const [terms, setTerms] = useState<Array<{ partner_share_bps: number; version: number; accepted_at: string | null }>>([])
  const [financials, setFinancials] = useState<{
    summary: {
      grossSalesCents: number
      partnerEarningsCents: number
      pendingCents: number
      transferredCents: number
      affiliateCommissionsCents: number
      stripeFeesCents: number
      sellbopRevenueCents: number
      refundsAdjustmentsCents: number
      reconciliationRequiredCount: number
    }
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [shareBps, setShareBps] = useState(5000)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const [detailRes, checklistRes, termsRes, financialsRes] = await Promise.all([
      fetch(`/api/admin/partnerships/${partnershipId}`),
      fetch(`/api/admin/partnerships/${partnershipId}/activate`),
      fetch(`/api/admin/partnerships/${partnershipId}/terms`),
      fetch(`/api/admin/partnerships/${partnershipId}/financials`),
    ])
    if (detailRes.ok) {
      const data = await detailRes.json()
      setDetail(data)
      setPartnerEmail((data.partnership?.partner_email as string) ?? '')
    }
    if (checklistRes.ok) {
      const data = await checklistRes.json()
      setChecklist(data.checklist)
    }
    if (termsRes.ok) {
      const data = await termsRes.json()
      setTerms(data.terms ?? [])
      const current = data.terms?.[0]
      if (current?.partner_share_bps) setShareBps(current.partner_share_bps)
    }
    if (financialsRes.ok) {
      const data = await financialsRes.json()
      setFinancials(data)
    } else {
      setFinancials(null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [partnershipId])

  async function manageShop() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/manage`, { method: 'POST' })
    if (res.ok) router.push('/dashboard')
  }

  async function generatePreview() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/preview`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) { setPreviewUrl(data.url); setMessage('Preview link generated.') }
    else setMessage(data.error ?? 'Failed.')
  }

  async function sendInvite() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerEmail }),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Invitation sent.' : (data.error ?? 'Failed.'))
    if (res.ok) load()
  }

  async function saveTerms() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerShareBps: shareBps }),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Revenue share updated (new version).' : (data.error ?? 'Failed.'))
    if (res.ok) load()
  }

  async function activateShop() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/activate`, { method: 'POST' })
    const data = await res.json()
    setMessage(res.ok ? 'Shop activated!' : (data.error ?? 'Activation failed.'))
    if (res.ok) load()
  }

  if (loading) return <div className="p-8">Loading…</div>
  if (!detail) return <div className="p-8">Not found.</div>

  const partnership = detail.partnership as Record<string, unknown>
  const store = detail.store as Record<string, unknown> | null
  const sellbopBps = sellbopShareBps(shareBps)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active="partnerships" />
      <main className="flex-1 overflow-y-auto">
        <AdminTopBar section="partnership" />
        <div className="p-8 max-w-3xl">
          <Link href="/internal/admin/partnerships" className="text-sm text-neutral-500 hover:text-black">← Partnerships</Link>
          <h1 className="text-2xl font-bold mt-4">{store?.name as string}</h1>
          <p className="text-sm text-neutral-500 capitalize mt-1">Status: {partnership.status as string}</p>

          <section className="mt-8 rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-semibold">Launch Checklist</h2>
            {checklist ? (
              <ul className="text-sm space-y-1">
                <li>{checklist.partnerClaimed ? '✓' : '○'} Partner claimed</li>
                <li>{checklist.revenueShareAccepted ? '✓' : '○'} Revenue share accepted</li>
                <li>{checklist.stripeConnected ? '✓' : '○'} Stripe connected</li>
                <li>{checklist.payoutsEnabled ? '✓' : '○'} Payouts enabled</li>
                <li>{checklist.hasLiveProduct ? '✓' : '○'} Live product</li>
              </ul>
            ) : (
              <p className="text-xs text-neutral-400">Checklist unavailable until migration 031 is applied.</p>
            )}
            {checklist?.canActivate && partnership.status !== 'active' && (
              <Button onClick={activateShop}>Activate Shop</Button>
            )}
            {checklist && !checklist.canActivate && checklist.blockers.length > 0 && (
              <p className="text-xs text-amber-700">{checklist.blockers.join(' · ')}</p>
            )}
          </section>

          <section className="mt-4 rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-semibold">Revenue Share</h2>
            <p className="text-sm text-neutral-600">
              Partner: <strong>{shareBps / 100}%</strong> · SellBop: <strong>{sellbopBps / 100}%</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {SHARE_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setShareBps(p)}
                  className={`rounded-lg border px-3 py-1 text-xs ${shareBps === p ? 'border-black bg-black text-white' : 'border-neutral-200'}`}
                >
                  {p / 100}%
                </button>
              ))}
            </div>
            <Input label="Custom Partner % (basis points)" type="number" value={shareBps} onChange={e => setShareBps(parseInt(e.target.value, 10) || 5000)} />
            <Button size="sm" variant="secondary" onClick={saveTerms}>Save Revenue Share</Button>
            {terms[0] && !terms[0].accepted_at && (
              <p className="text-xs text-amber-600">Current terms awaiting Partner acceptance (v{terms[0].version}).</p>
            )}
          </section>

          {financials?.summary && (
            <section className="mt-4 rounded-xl border bg-white p-5 space-y-3">
              <h2 className="font-semibold">Financials</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Gross Sales', financials.summary.grossSalesCents],
                  ['Affiliate Commissions', financials.summary.affiliateCommissionsCents],
                  ['Stripe Processing Fees', financials.summary.stripeFeesCents],
                  ['Partner Earnings', financials.summary.partnerEarningsCents],
                  ['Partner Transferred', financials.summary.transferredCents],
                  ['SellBop Revenue', financials.summary.sellbopRevenueCents],
                  ['Refunds', financials.summary.refundsAdjustmentsCents],
                  ['Outstanding / Pending', financials.summary.pendingCents],
                ].map(([label, cents]) => (
                  <div key={label as string} className="flex justify-between border-b border-neutral-50 pb-2">
                    <span className="text-neutral-500">{label as string}</span>
                    <span className="font-medium">{formatCurrency((cents as number) / 100)}</span>
                  </div>
                ))}
              </div>
              {financials.summary.reconciliationRequiredCount > 0 && (
                <p className="text-xs font-semibold text-red-600">
                  Reconciliation Required: {financials.summary.reconciliationRequiredCount} record(s)
                </p>
              )}
              <Link href="/internal/admin/financials" className="text-xs font-semibold text-neutral-600 hover:text-black">
                View platform financials →
              </Link>
            </section>
          )}

          <section className="mt-4 rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-semibold">Partner</h2>
            <Input label="Partner Email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} />
            <p className="text-xs text-neutral-400">{detail.productCount as number} products · Stripe: {(store?.stripe_charges_enabled as boolean) ? 'Connected' : 'Not connected'}</p>
          </section>

          <section className="mt-4 rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-semibold">Preview</h2>
            {previewUrl && <p className="text-xs break-all text-neutral-600">{previewUrl}</p>}
            <Button size="sm" variant="secondary" onClick={generatePreview}>Generate Preview Link</Button>
          </section>

          <section className="mt-4 rounded-xl border bg-white p-5 space-y-3">
            <h2 className="font-semibold">Invitation</h2>
            <Button size="sm" onClick={sendInvite}>Invite Partner</Button>
          </section>

          <div className="mt-6 flex gap-2">
            <Button onClick={manageShop}>Manage Shop</Button>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">View Preview</Button>
              </a>
            )}
          </div>

          {message && <p className="text-sm text-neutral-600 mt-4">{message}</p>}
        </div>
      </main>
    </div>
  )
}
