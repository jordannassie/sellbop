'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  PARTNER_APPLICATION_STATUSES,
  PARTNER_APPLICATION_STATUS_LABELS,
  type PartnerApplicationStatus,
} from '@/lib/partner-applications/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PartnerApplicationEditorProps {
  id: string
  initialStatus: PartnerApplicationStatus
  initialAdminNotes: string
}

export function PartnerApplicationEditor({
  id,
  initialStatus,
  initialAdminNotes,
}: PartnerApplicationEditorProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save changes.')
      toast.success('Application updated.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {PARTNER_APPLICATION_STATUSES.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                status === option
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400',
              )}
            >
              {PARTNER_APPLICATION_STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Admin Notes"
        hint="Private — never shown to the applicant."
        value={adminNotes}
        onChange={e => setAdminNotes(e.target.value)}
        rows={5}
        resize="vertical"
        placeholder="250K Instagram followers. Fitness audience. Could build 30-day fitness PDF."
      />

      <Button onClick={handleSave} loading={saving}>
        Save Changes
      </Button>
    </div>
  )
}
