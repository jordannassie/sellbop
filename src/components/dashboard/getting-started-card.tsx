'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Circle, X, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/hooks/use-user-store'
import { startStripeConnect } from '@/components/dashboard/stripe-payments-card'
import type { OnboardingStatus } from '@/app/api/onboarding/route'

const STORAGE_EXPANDED = 'sellbop_onboarding_expanded'

const STEPS = [
  {
    id: 'create_product',
    title: 'Create Your First Product',
    desc: 'Create something people can buy or download.',
    cta: 'Create Product',
    href: '/dashboard/products/new',
    autoKey: 'create_product' as const,
  },
  {
    id: 'stripe',
    title: 'Connect Stripe',
    desc: 'Connect your bank through Stripe so you can receive payments from your sales.',
    descComplete: 'Your store is ready to receive payments.',
    cta: 'Connect Stripe',
    stripeConnect: true,
    autoKey: 'bank_connected' as const,
  },
  {
    id: 'affiliates',
    title: 'Turn On Affiliates',
    desc: 'Let other people sell your products and earn commission.',
    cta: 'View Products',
    href: '/dashboard/products',
    autoKey: 'affiliates' as const,
  },
  {
    id: 'share_store',
    title: 'Share Your Store',
    desc: 'Start getting customers.',
    cta: 'View Store',
    href: null,
    manualKey: 'share_store' as const,
  },
]

function isStepComplete(
  step: (typeof STEPS)[number],
  status: OnboardingStatus,
): boolean {
  if (step.autoKey) return status.auto[step.autoKey]
  if (step.manualKey) return status.manual_steps[step.manualKey] === true
  return false
}

function readExpandedPreference(allComplete: boolean): boolean {
  if (typeof window === 'undefined') return false
  if (allComplete) return false
  return localStorage.getItem(STORAGE_EXPANDED) === 'true'
}

export function GettingStartedCard() {
  const { store } = useUserStore()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [connectingStripe, setConnectingStripe] = useState(false)

  function loadStatus() {
    return fetch('/api/onboarding')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        setStatus(data)
        if (data) {
          const complete = data.completed_count >= data.total_steps
          setExpanded(readExpandedPreference(complete))
        }
      })
  }

  useEffect(() => {
    loadStatus().finally(() => setLoading(false))
  }, [])

  if (loading || !status || status.dismissed) return null

  const allComplete = status.completed_count >= status.total_steps
  const progress = (status.completed_count / status.total_steps) * 100
  const storeUrl = store?.slug ? `/store/${store.slug}` : null

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem(STORAGE_EXPANDED, String(next))
  }

  async function dismiss() {
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        console.error('Failed to dismiss onboarding card', res.status, body)
        setError("Couldn't dismiss this. Try again.")
        return
      }
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to dismiss onboarding card', err)
      setError("Couldn't dismiss this. Try again.")
    }
  }

  async function markManual(key: string) {
    setError(null)
    setSavingKey(key)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_steps: { [key]: true } }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        console.error('Failed to mark step complete', res.status, body)
        setError(
          res.status === 401
            ? 'Please sign in again to save this.'
            : "Couldn't save that. Try again.",
        )
        return
      }
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to mark step complete', err)
      setError("Couldn't save that. Try again.")
    } finally {
      setSavingKey(null)
    }
  }

  async function handleStripeConnect() {
    setConnectingStripe(true)
    try {
      await startStripeConnect()
    } finally {
      setConnectingStripe(false)
    }
  }

  if (allComplete) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3 min-h-[72px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-black">Store setup complete</p>
            <Link
              href="/dashboard/resources"
              className="text-xs text-neutral-500 hover:text-black inline-flex items-center gap-0.5"
            >
              Browse all resources <ArrowRight size={11} />
            </Link>
          </div>
        </div>
        <button onClick={dismiss} className="text-neutral-400 hover:text-black p-1 flex-shrink-0" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full text-left px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-neutral-50/80 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-black">Get Your SellBop Store Ready</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {status.completed_count} of {status.total_steps} complete · {Math.round(progress)}%
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!expanded && (
              <span className="hidden sm:inline text-xs font-medium text-neutral-400">Continue setup</span>
            )}
            <ChevronDown
              size={18}
              className={`text-neutral-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: '#00E676' }}
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-neutral-100 pt-4">
            <div className="space-y-2.5">
              {STEPS.map(step => {
                const done = isStepComplete(step, status)
                const href = step.id === 'share_store' ? storeUrl : step.href

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 sm:p-4 ${
                      done ? 'border-emerald-100 bg-emerald-50/50' : 'border-neutral-100'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${done ? 'text-emerald-500' : 'text-neutral-300'}`}>
                      {done ? <Check size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-black">{step.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {done && 'descComplete' in step && step.descComplete
                          ? step.descComplete
                          : step.desc}
                      </p>
                      {!done && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {step.stripeConnect ? (
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={handleStripeConnect}
                              disabled={connectingStripe}
                            >
                              {connectingStripe ? 'Connecting…' : step.cta}
                            </Button>
                          ) : href ? (
                            <Link href={href} target={step.id === 'share_store' ? '_blank' : undefined}>
                              <Button size="xs" variant="secondary">
                                {step.id === 'share_store' && <ExternalLink size={11} />}
                                {step.cta}
                              </Button>
                            </Link>
                          ) : null}
                          {step.manualKey && (
                            <button
                              type="button"
                              onClick={() => markManual(step.manualKey!)}
                              disabled={savingKey === step.manualKey}
                              className="text-xs text-neutral-400 hover:text-black underline underline-offset-2 disabled:opacity-50 disabled:cursor-wait"
                            >
                              {savingKey === step.manualKey ? 'Saving…' : 'Mark complete'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-2">
              <Link
                href="/dashboard/resources"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-black"
              >
                Browse all resources <ArrowRight size={12} />
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-neutral-400 hover:text-black"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
