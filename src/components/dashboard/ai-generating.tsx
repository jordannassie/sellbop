'use client'
/**
 * AIGenerating — full-page loading screen shown while the AI generates content.
 * Cycles through progress steps with a pulsing SellBop/Sparkle icon and a step
 * progress list.
 */
import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  'Understanding your idea...',
  'Writing your store headline...',
  'Creating your product page...',
  'Suggesting pricing...',
  'Building FAQ...',
  'Preparing launch copy...',
]

interface AIGeneratingProps {
  /** Override the default 6 steps with a custom label list */
  steps?: string[]
}

export function AIGenerating({ steps = STEPS }: AIGeneratingProps) {
  const [current, setCurrent] = useState(0)

  // Advance one step every 2.4 s; stop at the last step
  useEffect(() => {
    const t = setInterval(() => {
      setCurrent(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2400)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div className="flex flex-col items-center py-16 text-center select-none">
      {/* ── Pulsing icon ─────────────────────────────────────── */}
      <div className="relative mb-8 inline-flex">
        {/* Soft glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-black opacity-10 blur-md scale-125 animate-pulse" />
        {/* Icon container */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-xl animate-pulse">
          <Sparkles
            size={28}
            className="text-white"
            style={{ animation: 'spin 4s linear infinite' }}
          />
        </div>
      </div>

      {/* ── Current step label ───────────────────────────────── */}
      <p className="min-h-[1.75rem] text-base font-semibold text-black transition-all duration-300">
        {steps[current]}
      </p>
      <p className="mt-1.5 text-sm text-neutral-400">This takes 5–20 seconds</p>

      {/* ── Progress bar (pill dots) ─────────────────────────── */}
      <div className="mt-5 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i === current
                ? 'w-6 bg-black'
                : i < current
                  ? 'w-2 bg-neutral-300'
                  : 'w-1.5 bg-neutral-200',
            )}
          />
        ))}
      </div>

      {/* ── Step list ────────────────────────────────────────── */}
      <div className="mt-8 w-full max-w-xs space-y-2.5 text-left">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2.5 text-sm transition-all duration-300',
              i < current
                ? 'text-neutral-400'
                : i === current
                  ? 'text-black font-medium'
                  : 'text-neutral-200',
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                i < current
                  ? 'bg-black text-white'
                  : i === current
                    ? 'border-2 border-black text-black'
                    : 'border border-neutral-200 text-neutral-300',
              )}
            >
              {i < current ? <Check size={10} /> : i + 1}
            </div>
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
