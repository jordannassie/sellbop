'use client'

import Link from 'next/link'
import { Grid3x3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SidebarMarketplaceToggle({
  storeId,
  enabled,
  disabled,
  onUpdated,
}: {
  storeId: string | null
  enabled: boolean
  disabled?: boolean
  onUpdated?: (next: boolean) => void
}) {
  const [localEnabled, setLocalEnabled] = useState(enabled)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalEnabled(enabled)
  }, [enabled, storeId])

  async function handleChange(next: boolean) {
    if (!storeId || saving || disabled) return

    const previous = localEnabled
    setLocalEnabled(next)
    setSaving(true)

    try {
      const res = await fetch(`/api/stores/${storeId}/marketplace`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace_enabled: next }),
      })
      if (!res.ok) throw new Error()
      onUpdated?.(next)
    } catch {
      setLocalEnabled(previous)
      toast.error("Couldn't update Marketplace settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="ml-6 flex items-center justify-between gap-2 rounded-xl px-3 py-1.5"
      title={
        localEnabled
          ? 'Your eligible products can appear in Marketplace.'
          : 'Your products are hidden from Marketplace but remain live in your store.'
      }
    >
      <span className="text-xs text-neutral-500">Sell on Marketplace</span>
      <Toggle
        checked={localEnabled}
        onChange={handleChange}
        disabled={!storeId || saving || disabled}
        variant="success"
        size="sm"
      />
    </div>
  )
}

export function MarketplaceNavGroup({
  pathname,
  onNavigate,
  storeId,
  marketplaceEnabled,
  switching,
  onMarketplaceUpdated,
}: {
  pathname: string
  onNavigate?: () => void
  storeId: string | null
  marketplaceEnabled: boolean
  switching?: boolean
  onMarketplaceUpdated?: (next: boolean) => void
}) {
  const active = pathname === '/marketplace' || pathname.startsWith('/marketplace/')

  return (
    <div className="space-y-0.5">
      <Link
        href="/marketplace"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-neutral-900 font-medium text-white'
            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
        )}
      >
        <Grid3x3 size={16} />
        Marketplace
      </Link>
      <SidebarMarketplaceToggle
        storeId={storeId}
        enabled={marketplaceEnabled}
        disabled={switching}
        onUpdated={onMarketplaceUpdated}
      />
    </div>
  )
}
