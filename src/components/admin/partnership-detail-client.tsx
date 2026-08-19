'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PartnershipDetailClient({ partnershipId }: { partnershipId: string }) {
  const router = useRouter()
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/partnerships/${partnershipId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDetail(data)
          setPartnerEmail((data.partnership?.partner_email as string) ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [partnershipId])

  async function manageShop() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/manage`, { method: 'POST' })
    if (res.ok) router.push('/dashboard')
  }

  async function generatePreview() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/preview`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPreviewUrl(data.url)
      setMessage('Preview link generated.')
    } else setMessage(data.error ?? 'Failed.')
  }

  async function sendInvite() {
    const res = await fetch(`/api/admin/partnerships/${partnershipId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerEmail }),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Invitation sent.' : (data.error ?? 'Failed.'))
  }

  if (loading) return <div className="p-8">Loading…</div>
  if (!detail) return <div className="p-8">Not found.</div>

  const partnership = detail.partnership as Record<string, unknown>
  const store = detail.store as Record<string, unknown> | null

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar active="partnerships" />
      <main className="flex-1 p-8 max-w-3xl">
        <Link href="/internal/admin/partnerships" className="text-sm text-neutral-500 hover:text-black">← Partnerships</Link>
        <h1 className="text-2xl font-bold mt-4">{store?.name as string}</h1>
        <p className="text-sm text-neutral-500 capitalize mt-1">Status: {partnership.status as string}</p>

        <section className="mt-8 rounded-xl border bg-white p-5 space-y-3">
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
      </main>
    </div>
  )
}
