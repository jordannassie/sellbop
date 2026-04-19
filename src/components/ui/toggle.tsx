'use client'
import { cn } from '@/lib/utils'
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50',
          checked ? 'bg-black' : 'bg-neutral-200')}>
        <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
      </button>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  )
}
