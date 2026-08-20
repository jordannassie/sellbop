'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slugFromText } from '@/lib/supabase/ensure-user-store'
import type { PartnershipStatus } from '@/lib/partnerships/constants'

interface PartnershipRow {
  id: string
  storeId: string
  storeName: string
  storeSlug: string
  status: PartnershipStatus
  partnerName: string | null
  partnerEmail: string | null
  productCount: number
  stripeConnected: boolean
  createdAt: string
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  preview: 'bg-blue-50 text-blue-700',
  invited: 'bg-amber-50 text-amber-700',
  claimed: 'bg-emerald-50 text-emerald-700',
  active: 'bg-green-50 text-green-800',
  paused: 'bg-neutral-100 text-neutral-500',
  declined: 'bg-red-50 text-red-600',
  archived: 'bg-neutral-100 text-neutral-400',
}

export function PartnershipsAdminClient() {
  const router = useRouter()
  const [rows, setRows] = useState<PartnershipRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shopName, setShopName] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const [migrationRequired, setMigrationRequired] = useState(false)

  async function load() {
    setLoading(true)
    setMigrationRequired(false)
    const res = await fetch('/api/admin/partnerships')
    if (res.ok) {
      const data = await res.json()
      setRows(data.partnerships ?? [])
      setMigrationRequired(Boolean(data.migrationRequired))
    } else {
      const data = await res.json().catch(() => ({}))
      setMigrationRequired(Boolean(data.migrationRequired))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!slugTouched && shopName) setShopSlug(slugFromText(shopName))
  }, [shopName, slugTouched])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/admin/partnerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopName, shopSlug, partnerName, partnerEmail }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not create Partner Shop.')
      return
    }
    setModalOpen(false)
    router.push(`/internal/admin/partnerships/${data.partnershipId}`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar active="partnerships" />
      <main className="flex-1 overflow-y-auto">
        <AdminTopBar section="partnerships" />
        <div className="p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Partnerships</h1>
            <p className="mt-1 text-sm text-neutral-500 max-w-xl">
              Build digital Shops for creators, preview them privately, and invite Partners to claim them.
            </p>
          </div>
          <Button onClick={() => { setModalOpen(true); setError(null) }}>
            <Plus size={16} className="mr-1" /> Create Partner Shop
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-neutral-500"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : migrationRequired ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-amber-900">Partnership system not configured</h2>
            <p className="mt-2 text-sm text-amber-800 max-w-lg mx-auto">
              Migration 030 (<code className="text-xs">030_partner_shops.sql</code>) has not been applied to production yet.
              Existing SellBop commerce continues to work normally. Apply migrations 029 and 030 to enable Partner Shops.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
            No Partner Shops yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-black">{row.storeName}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[row.status] ?? STATUS_CLASS.draft}`}>
                        {row.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">/{row.storeSlug}</p>
                    {(row.partnerName || row.partnerEmail) && (
                      <p className="text-sm text-neutral-600 mt-2">
                        {row.partnerName && <span>{row.partnerName}</span>}
                        {row.partnerEmail && <span className="text-neutral-400"> · {row.partnerEmail}</span>}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-2">
                      {row.productCount} products · Stripe: {row.stripeConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/internal/admin/partnerships/${row.id}`}>
                      <Button size="sm" variant="secondary">Manage</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold">Create Partner Shop</h2>
              <form onSubmit={handleCreate} className="mt-4 space-y-3">
                <Input label="Creator / Partner Name" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Jessica Smith" />
                <Input label="Partner Email (optional)" type="email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} placeholder="jessica@example.com" />
                <Input label="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Jessica Fitness" required />
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Shop URL</label>
                  <div className="flex items-center rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                    <span className="text-neutral-400">sellbop.com/</span>
                    <input className="flex-1 bg-transparent outline-none" value={shopSlug} onChange={e => { setSlugTouched(true); setShopSlug(slugFromText(e.target.value)) }} required />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={creating}>Create Partner Shop</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
