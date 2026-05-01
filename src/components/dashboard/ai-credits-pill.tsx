'use client'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AICreditsPillProps {
  creditsRemaining?: number
  creditsTotal?: number
  lowThreshold?: number
}

export function AICreditsPill({
  creditsRemaining = 18,
  creditsTotal = 50,
  lowThreshold = 20,
}: AICreditsPillProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isLow = creditsRemaining <= lowThreshold
  const pct = Math.max(0, Math.min(100, Math.round((creditsRemaining / creditsTotal) * 100)))

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* ── Pill button ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
          isLow
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50',
        )}
      >
        <Zap
          size={11}
          className={cn('flex-shrink-0', isLow ? 'text-amber-500' : 'text-neutral-400')}
        />
        <span>{creditsRemaining} AI Credits</span>
      </button>

      {/* ── Dropdown ────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-black">AI Credits</p>
            <span className={cn(
              'text-lg font-bold',
              isLow ? 'text-amber-600' : 'text-neutral-900',
            )}>
              {creditsRemaining}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
            <span>{creditsRemaining} remaining</span>
            <span>of {creditsTotal}</span>
          </div>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={cn('h-full rounded-full transition-all', isLow ? 'bg-amber-400' : 'bg-emerald-500')}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mb-3 text-[11px] leading-relaxed text-neutral-500">
            Credits are only used when your agent creates work for you.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); toast.info('Credit packs are coming soon.') }}
              className="flex-1 rounded-xl bg-black py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Buy Credits
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); toast.info('Credit usage history is coming soon.') }}
              className="flex-1 rounded-xl border border-neutral-200 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-black"
            >
              View Usage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
