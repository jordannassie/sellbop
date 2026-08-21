'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
  /** default = black; success = SellBop green (#00A854) */
  variant?: 'default' | 'success'
  size?: 'default' | 'sm'
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  variant = 'default',
  size = 'default',
}: ToggleProps) {
  const trackClass = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'
  const thumbClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const thumbOn = size === 'sm' ? 'translate-x-3.5' : 'translate-x-4'

  return (
    <label className={cn('flex items-center gap-3', label ? 'cursor-pointer' : 'cursor-default')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50',
          trackClass,
          checked
            ? variant === 'success' ? 'bg-[#00A854]' : 'bg-black'
            : 'bg-neutral-200',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform',
            thumbClass,
            checked ? thumbOn : 'translate-x-0',
          )}
        />
      </button>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  )
}
