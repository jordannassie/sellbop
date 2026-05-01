'use client'
/**
 * LinkField — inline editable URL slug with live availability check.
 * Used for both store links (/store/[slug]) and product links (/p/[slug]).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Loader2, X, AlertCircle } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { cn } from '@/lib/utils'

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface LinkFieldProps {
  /** Current slug value */
  value: string
  /** Called when a valid, available slug is confirmed */
  onChange: (slug: string) => void
  /** Base URL to display before the slug, e.g. "sellbop.com/store/" */
  prefix: string
  /** API route to check availability, e.g. "/api/availability/store-link" */
  checkUrl: string
  /** Extra query param to allow the current owner to keep their link */
  ownerParam?: { key: string; value: string }
  label?: string
  required?: boolean
}

export function LinkField({
  value,
  onChange,
  prefix,
  checkUrl,
  ownerParam,
  label,
  required,
}: LinkFieldProps) {
  const [draft, setDraft] = useState(value)
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const [message, setMessage] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If the parent value changes externally (e.g. AI prefill), sync draft
  useEffect(() => {
    setDraft(value)
    setStatus('idle')
  }, [value])

  const check = useCallback(
    async (slug: string) => {
      if (!slug || slug === value) { setStatus('idle'); return }
      setStatus('checking')
      setMessage('')
      try {
        const params = new URLSearchParams({ value: slug })
        if (ownerParam) params.set(ownerParam.key, ownerParam.value)
        const res = await fetch(`${checkUrl}?${params.toString()}`)
        const data = (await res.json()) as { status: string; message?: string }
        setStatus(data.status as AvailabilityStatus)
        setMessage(data.message ?? '')
        if (data.status === 'available') onChange(slug)
      } catch {
        setStatus('idle')
      }
    },
    [checkUrl, ownerParam, value, onChange],
  )

  function handleChange(raw: string) {
    const slug = slugify(raw)
    setDraft(slug)
    setStatus('idle')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (slug.length >= 3) {
      debounceRef.current = setTimeout(() => void check(slug), 500)
    }
  }

  const statusIcon = {
    checking:  <Loader2 size={14} className="animate-spin text-neutral-400" />,
    available: <Check size={14} className="text-emerald-500" />,
    taken:     <X size={14} className="text-red-500" />,
    invalid:   <AlertCircle size={14} className="text-amber-500" />,
    idle:      null,
  }[status]

  const borderColor = {
    available: 'border-emerald-400 ring-1 ring-emerald-200',
    taken:     'border-red-400 ring-1 ring-red-100',
    invalid:   'border-amber-400 ring-1 ring-amber-100',
    checking:  'border-neutral-300',
    idle:      'border-neutral-200',
  }[status]

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={cn('flex items-center rounded-xl border bg-white overflow-hidden transition-all', borderColor)}>
        {/* Prefix */}
        <span className="shrink-0 px-3 py-2.5 text-xs text-neutral-400 bg-neutral-50 border-r border-neutral-200 select-none whitespace-nowrap">
          {prefix}
        </span>

        {/* Editable slug */}
        <input
          type="text"
          value={draft}
          onChange={e => handleChange(e.target.value)}
          className="flex-1 px-3 py-2.5 text-sm text-black bg-transparent focus:outline-none"
          placeholder="your-link"
          required={required}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />

        {/* Status icon */}
        {statusIcon && (
          <span className="shrink-0 pr-3">{statusIcon}</span>
        )}
      </div>

      {/* Status message */}
      {status === 'available' && !message && (
        <p className="text-xs text-emerald-600">Available</p>
      )}
      {(status === 'taken' || status === 'invalid') && message && (
        <p className="text-xs text-red-500">{message}</p>
      )}
      {status === 'idle' && draft && (
        <p className="text-xs text-neutral-400">
          Your link: <span className="font-mono">{prefix}{draft}</span>
        </p>
      )}
    </div>
  )
}
