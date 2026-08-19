'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function PartnerShopPreviewButton({ onNavigate }: { onNavigate?: () => void }) {
  const [loading, setLoading] = useState(false)

  async function openPreview() {
    setLoading(true)
    try {
      const res = await fetch('/api/stores/manager-preview', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        onNavigate?.()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={openPreview}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60"
    >
      <ExternalLink size={14} /> {loading ? 'Opening…' : 'Preview Shop'}
    </button>
  )
}
