'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PARTNER_BADGE_BLUE } from '@/lib/partner-badge'
import { PartnerBadgeIcon } from '@/components/ui/partner-badge-icon'

export function PartnerStatusControl({
  userId,
  initialIsPartner,
}: {
  userId: string
  initialIsPartner: boolean
}) {
  const router = useRouter()
  const [isPartner, setIsPartner] = useState(initialIsPartner)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updatePartner = useCallback(async (next: boolean) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/partner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPartner: next }),
      })
      const data = await res.json() as { isPartner?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to update partner status.')
        return
      }
      setIsPartner(Boolean(data.isPartner))
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }, [userId, router])

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black">SellBop Partner</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Grant or remove official SellBop Partner status for this user.
          </p>
        </div>
        {isPartner ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
            style={{ background: PARTNER_BADGE_BLUE }}
          >
            <PartnerBadgeIcon size={14} />
            Partner ✓
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Not a Partner
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isPartner ? (
          <button
            type="button"
            onClick={() => updatePartner(false)}
            disabled={saving}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Remove Partner Badge'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updatePartner(true)}
            disabled={saving}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: PARTNER_BADGE_BLUE }}
          >
            {saving ? 'Saving…' : 'Grant Partner Badge'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
