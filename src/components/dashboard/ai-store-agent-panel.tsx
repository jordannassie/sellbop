'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Wand2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  FileText,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiComposer } from '@/components/ai/ai-composer'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Recommendation {
  icon: React.ElementType
  title: string
  description: string
  buttonLabel: string
}

interface ActivityItem {
  status: 'done' | 'waiting'
  label: string
  meta: string
}

// ── Static demo data ──────────────────────────────────────────────────────────

const RECOMMENDATIONS: Recommendation[] = [
  {
    icon: TrendingUp,
    title: 'Optimize your product page',
    description: 'I found 3 conversion improvements.',
    buttonLabel: 'Apply with AI',
  },
  {
    icon: Sparkles,
    title: 'Create launch content',
    description: 'Generate 10 posts, 3 emails, and 5 ad ideas.',
    buttonLabel: 'Generate',
  },
  {
    icon: ShoppingCart,
    title: 'Build an upsell bundle',
    description: 'Increase average order value with a bundle.',
    buttonLabel: 'Create Bundle',
  },
  {
    icon: FileText,
    title: 'Weekly agent report',
    description: 'Sales are low this week. I recommend a weekend promo.',
    buttonLabel: 'View Plan',
  },
]

const ACTIVITY: ActivityItem[] = [
  { status: 'done', label: 'Generated product page draft', meta: '2 minutes ago' },
  { status: 'done', label: 'Suggested price: $29', meta: '5 minutes ago' },
  { status: 'done', label: 'Added FAQ section', meta: '7 minutes ago' },
  { status: 'waiting', label: 'Waiting for approval', meta: 'Product page copy' },
]

// ── Toggle ────────────────────────────────────────────────────────────────────

function AgentToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none',
        on ? 'bg-emerald-500' : 'bg-neutral-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIStoreAgentPanel() {
  const [agenticMode, setAgenticMode] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)

  function handleRun(text: string) {
    if (!text.trim()) return
    setRunning(true)
    // Phase 1: demo only — reset after a brief delay
    setTimeout(() => setRunning(false), 1800)
  }

  return (
    <div className="mb-8 space-y-5">
      {/* ── Main agent card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left: icon + title + toggle */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black">
              <Wand2 size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-black">AI Store Agent</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-neutral-500">Agentic Mode</span>
              <AgentToggle on={agenticMode} onToggle={() => setAgenticMode(v => !v)} />
              <span
                className={cn(
                  'text-xs font-semibold',
                  agenticMode ? 'text-emerald-600' : 'text-neutral-400',
                )}
              >
                {agenticMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Right: credits widget */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
            <span className="text-xs font-medium text-amber-700">AI Credits: 18 remaining</span>
            <Link
              href="/dashboard/billing"
              className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Buy Credits
            </Link>
          </div>
        </div>

        {/* Prompt box */}
        <AiComposer
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleRun}
          loading={running}
          rows={2}
          submitLabel="Run Agent"
          placeholder="Describe what you want to sell and SellBop will build, improve, and grow your store."
          showChips={false}
        />

        {/* Agentic mode OFF notice */}
        {!agenticMode && !running && (
          <p className="mt-2 text-xs text-neutral-400">
            Agentic Mode is off. SellBop will only run when you ask.
          </p>
        )}
      </div>

      {/* ── Recommendations + Activity row ───────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Recommendations */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Agent Recommendations
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {RECOMMENDATIONS.map(rec => {
              const Icon = rec.icon
              return (
                <div
                  key={rec.title}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100">
                      <Icon size={15} className="text-neutral-600" />
                    </div>
                    <p className="mb-1 text-sm font-semibold text-black">{rec.title}</p>
                    <p className="text-xs leading-relaxed text-neutral-500">{rec.description}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-auto w-full rounded-xl bg-black py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
                  >
                    {rec.buttonLabel}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent Activity */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Agent Activity
          </h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-1">
              <p className="text-sm font-bold text-black">Agent Activity</p>
              <p className="text-xs text-neutral-400">Live updates from your AI Store Agent.</p>
            </div>
            <div className="mt-3 space-y-3">
              {ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {item.status === 'done' ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Clock size={15} className="mt-0.5 shrink-0 text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug text-neutral-800">{item.label}</p>
                    <p className="text-[11px] text-neutral-400">{item.meta}</p>
                  </div>
                  {item.status === 'waiting' && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:border-black hover:text-black"
                    >
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
