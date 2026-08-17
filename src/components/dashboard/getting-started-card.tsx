'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Circle, X, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/hooks/use-user-store'
import type { OnboardingStatus } from '@/app/api/onboarding/route'

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
    id: 'claude',
    title: 'Connect Claude',
    desc: 'Let AI help build and manage your products.',
    cta: 'Connect Claude',
    href: '/dashboard/resources/connect-ai#claude',
    manualKey: 'claude' as const,
  },
  {
    id: 'higgsfield',
    title: 'Connect Higgsfield',
    desc: 'Generate professional product images and videos.',
    cta: 'Learn How',
    href: '/dashboard/resources/connect-ai#higgsfield',
    manualKey: 'higgsfield' as const,
  },
  {
    id: 'affiliates',
    title: 'Turn On Affiliates',
    desc: 'Let other people sell your products.',
    cta: 'Set Up Affiliates',
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

export function GettingStartedCard() {
  const { store } = useUserStore()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.ok ? r.json() : null)
      .then(data => setStatus(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !status || status.dismissed) return null

  const allComplete = status.completed_count >= status.total_steps

  async function dismiss() {
    const res = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismissed: true }),
    })
    if (res.ok) {
      const data = await res.json()
      setStatus(data)
    }
  }

  async function markManual(key: string) {
    const res = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_steps: { [key]: true } }),
    })
    if (res.ok) {
      const data = await res.json()
      setStatus(data)
    }
  }

  if (allComplete) {
    return (
      <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-black">Your store is ready to grow.</p>
            <p className="text-sm text-neutral-600">All setup steps complete.</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-neutral-400 hover:text-black p-1" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    )
  }

  const progress = (status.completed_count / status.total_steps) * 100
  const storeUrl = store?.slug ? `/store/${store.slug}` : null

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-black">Get Your SellBop Store Ready</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Complete these steps and start selling.</p>
        </div>
        <button onClick={dismiss} className="text-neutral-400 hover:text-black p-1 flex-shrink-0" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
          <span>{status.completed_count} of {status.total_steps} complete</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: '#00E676' }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map(step => {
          const done = isStepComplete(step, status)
          const href = step.id === 'share_store' ? storeUrl : step.href

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-xl border p-4 ${done ? 'border-emerald-100 bg-emerald-50/50' : 'border-neutral-100'}`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${done ? 'text-emerald-500' : 'text-neutral-300'}`}>
                {done ? <Check size={18} /> : <Circle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-black">{step.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{step.desc}</p>
                {!done && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {href && (
                      <Link href={href} target={step.id === 'share_store' ? '_blank' : undefined}>
                        <Button size="xs" variant="secondary">
                          {step.id === 'share_store' && <ExternalLink size={11} />}
                          {step.cta}
                        </Button>
                      </Link>
                    )}
                    {step.manualKey && (
                      <button
                        type="button"
                        onClick={() => markManual(step.manualKey!)}
                        className="text-xs text-neutral-400 hover:text-black underline underline-offset-2"
                      >
                        Mark complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Link href="/dashboard/resources" className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-neutral-500 hover:text-black">
        Browse all resources <ArrowRight size={12} />
      </Link>
    </div>
  )
}
