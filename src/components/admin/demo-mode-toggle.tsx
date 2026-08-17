'use client'

import { useCallback, useEffect, useState } from 'react'

type Status = 'loading' | 'idle' | 'saving' | 'error'

export function DemoModeToggle() {
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings/demo-mode')
      .then(r => r.json())
      .then((d: { enabled?: boolean }) => {
        setEnabled(Boolean(d.enabled))
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [])

  const toggle = useCallback(async (next: boolean) => {
    setStatus('saving')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/settings/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json() as { enabled?: boolean; error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to save')
        setStatus('error')
        return
      }
      setEnabled(Boolean(data.enabled))
      setStatus('idle')
    } catch {
      setErrorMsg('Network error')
      setStatus('error')
    }
  }, [])

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-black">Demo Mode</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Show or hide demo accounts, demo products, and demo store examples across SellBop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggle(!enabled)}
          disabled={status === 'loading' || status === 'saving'}
          className={[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            enabled ? 'bg-black' : 'bg-neutral-200',
          ].join(' ')}
          aria-pressed={enabled}
        >
          <span
            className={[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
              'transition duration-200 ease-in-out',
              enabled ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {status === 'loading' && (
          <span className="text-[10px] text-neutral-400">Loading…</span>
        )}
        {status === 'saving' && (
          <span className="text-[10px] text-neutral-400">Saving…</span>
        )}
        {status === 'idle' && (
          <span className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            enabled
              ? 'bg-amber-50 text-amber-700'
              : 'bg-green-50 text-green-700',
          ].join(' ')}>
            <span className={[
              'h-1.5 w-1.5 rounded-full',
              enabled ? 'bg-amber-500' : 'bg-green-500',
            ].join(' ')} />
            {enabled ? 'Demo ON' : 'Demo OFF'}
          </span>
        )}
        {status === 'error' && (
          <span className="text-[10px] text-red-600">{errorMsg || 'Error'}</span>
        )}
      </div>

      <p className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-[10px] text-amber-700">
        Keep Demo Mode <strong>OFF</strong> for real users and production testing.
        When OFF, demo accounts, demo products, and /demo are hidden from the public.
      </p>
    </div>
  )
}
