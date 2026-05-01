'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Wand2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  FileText,
  Package,
  Zap,
  Loader2,
  AlertCircle,
  Mail,
  BarChart3,
  BookOpen,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentRecommendation, AgentActivity, AgentRunResponse } from '@/lib/agent/types'

// ── Credits config (Phase 1: static) ─────────────────────────────────────────
const CREDITS_REMAINING = 18
const CREDITS_TOTAL = 50

// ── Prompt suggestion chips ───────────────────────────────────────────────────
const CHIPS = [
  { label: 'Build my first product', prompt: 'Help me create my first digital product and product page.' },
  { label: 'Improve my store', prompt: 'Audit my store and suggest improvements to increase conversions.' },
  { label: 'Create launch content', prompt: 'Generate launch content including social posts and an email.' },
  { label: 'Suggest pricing', prompt: 'Suggest the best price for my digital product.' },
  { label: 'Build a membership', prompt: 'Help me build a membership offer with recurring revenue.' },
]

// ── Default demo recommendations (shown before first run) ─────────────────────
const DEFAULT_RECS: AgentRecommendation[] = [
  {
    id: 'def-optimize',
    type: 'GENERATE_PRODUCT_PAGE',
    title: 'Optimize your product page',
    description: 'I found 3 conversion improvements to apply.',
    creditCost: 10,
    priority: 'high',
    requiresApproval: true,
    status: 'ready',
  },
  {
    id: 'def-launch',
    type: 'GENERATE_SOCIAL_POSTS',
    title: 'Create launch content',
    description: 'Generate 10 posts, 3 emails, and 5 ad ideas.',
    creditCost: 20,
    priority: 'medium',
    requiresApproval: false,
    status: 'ready',
  },
  {
    id: 'def-bundle',
    type: 'CREATE_BUNDLE',
    title: 'Build an upsell bundle',
    description: 'Increase average order value with a bundle.',
    creditCost: 15,
    priority: 'medium',
    requiresApproval: true,
    status: 'ready',
  },
  {
    id: 'def-growth',
    type: 'GENERAL_GUIDANCE',
    title: 'Weekly growth plan',
    description: 'Get a simple plan to grow sales this week.',
    creditCost: 25,
    priority: 'low',
    requiresApproval: false,
    status: 'ready',
  },
]

const DEFAULT_ACTIVITY: AgentActivity[] = [
  { id: 'a1', title: 'Generated product page draft', status: 'completed', createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 'a2', title: 'Suggested price: $29', status: 'completed', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'a3', title: 'Added FAQ section', status: 'completed', createdAt: new Date(Date.now() - 7 * 60000).toISOString() },
  { id: 'a4', title: 'Waiting for approval', description: 'Product page copy', status: 'waiting_approval', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
]

// ── Icon map for recommendation types ────────────────────────────────────────
const REC_ICONS: Record<string, React.ElementType> = {
  CREATE_PRODUCT_DRAFT:    Package,
  GENERATE_PRODUCT_PAGE:   TrendingUp,
  SUGGEST_PRICING:         BarChart3,
  CREATE_FAQ:              BookOpen,
  CREATE_LAUNCH_PLAN:      Zap,
  GENERATE_SOCIAL_POSTS:   Sparkles,
  GENERATE_EMAIL:          Mail,
  STORE_AUDIT:             AlertCircle,
  CREATE_BUNDLE:           ShoppingCart,
  CREATE_MEMBERSHIP_PLAN:  CreditCard,
  CONNECT_PAYMENTS:        CreditCard,
  PUBLISH_STORE:           Zap,
  GENERAL_GUIDANCE:        FileText,
}

// ── Utility: relative time ────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
}

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

// ── Recommendation card ───────────────────────────────────────────────────────
function RecCard({ rec }: { rec: AgentRecommendation }) {
  const Icon = REC_ICONS[rec.type] ?? Sparkles
  const priorityDot = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-neutral-300' }[rec.priority]

  function handleAction() {
    toast.info(`Coming soon: this action will use ${rec.creditCost} credits.`)
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100">
            <Icon size={15} className="text-neutral-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot)} />
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
              {rec.creditCost} cr
            </span>
          </div>
        </div>
        <p className="mb-1 text-sm font-semibold leading-snug text-black">{rec.title}</p>
        <p className="text-xs leading-relaxed text-neutral-500">{rec.description}</p>
        {rec.requiresApproval && (
          <p className="mt-1.5 text-[10px] text-neutral-400">Requires your approval</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleAction}
        className="mt-auto w-full rounded-xl bg-black py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
      >
        {rec.type === 'GENERATE_PRODUCT_PAGE' ? 'Apply with AI' :
         rec.type === 'GENERATE_SOCIAL_POSTS' ? 'Generate' :
         rec.type === 'CREATE_BUNDLE' ? 'Create Bundle' :
         rec.type === 'CREATE_MEMBERSHIP_PLAN' ? 'Build Membership' :
         rec.type === 'STORE_AUDIT' ? 'Run Audit' :
         rec.type === 'SUGGEST_PRICING' ? 'Get Pricing' :
         rec.type === 'CREATE_LAUNCH_PLAN' ? 'View Plan' :
         'Apply with AI'}
      </button>
    </div>
  )
}

// ── Activity item ─────────────────────────────────────────────────────────────
function ActivityItem({ item }: { item: AgentActivity }) {
  const isDone = item.status === 'completed'
  const isWaiting = item.status === 'waiting_approval'
  const isProgress = item.status === 'in_progress'

  return (
    <div className="flex items-start gap-2.5">
      {isDone && <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />}
      {isWaiting && <Clock size={15} className="mt-0.5 shrink-0 text-amber-400" />}
      {isProgress && <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin text-blue-400" />}
      {item.status === 'failed' && <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-snug text-neutral-800">{item.title}</p>
        <p className="text-[11px] text-neutral-400">
          {item.description ? `${item.description} · ` : ''}{relativeTime(item.createdAt)}
        </p>
      </div>
      {isWaiting && (
        <button
          type="button"
          onClick={() => toast.info('Review coming soon.')}
          className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:border-black hover:text-black"
        >
          Review
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIStoreAgentPanel() {
  const [agenticMode, setAgenticMode] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [agentMessage, setAgentMessage] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>(DEFAULT_RECS)
  const [activity, setActivity] = useState<AgentActivity[]>(DEFAULT_ACTIVITY)
  const [hasRun, setHasRun] = useState(false)

  async function handleRun() {
    const text = prompt.trim()
    if (!text) return
    setRunning(true)
    setAgentMessage(null)
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, agenticMode }),
      })
      if (!res.ok) throw new Error('Agent request failed')
      const data = (await res.json()) as AgentRunResponse
      setAgentMessage(data.message)
      setRecommendations(data.recommendations)
      setActivity(data.activity)
      setHasRun(true)
    } catch {
      toast.error('Agent encountered an error. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !running) {
      e.preventDefault()
      void handleRun()
    }
  }

  const creditsPercent = Math.round((CREDITS_REMAINING / CREDITS_TOTAL) * 100)
  const lowCredits = CREDITS_REMAINING < 25

  return (
    <div className="mb-8 space-y-5">

      {/* ── Main card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          {/* Left: identity + toggle */}
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black">
                <Wand2 size={13} className="text-white" />
              </div>
              <span className="text-sm font-bold text-black">AI Store Agent</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                agenticMode ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500',
              )}>
                {agenticMode ? 'Working now' : 'Ready'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-2">
              Your agent helps you build, launch, and grow your digital business.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Agentic Mode</span>
              <AgentToggle on={agenticMode} onToggle={() => setAgenticMode(v => !v)} />
              <span className={cn('text-xs font-semibold', agenticMode ? 'text-emerald-600' : 'text-neutral-400')}>
                {agenticMode ? 'ON' : 'OFF'}
              </span>
            </div>
            {agenticMode && (
              <p className="mt-1 text-[11px] text-neutral-400">
                When ON, SellBop recommends what to do next. You approve before anything important changes.
              </p>
            )}
            {!agenticMode && (
              <p className="mt-1 text-[11px] text-amber-600">
                Agentic Mode is off. SellBop will only run when you ask.
              </p>
            )}
          </div>

          {/* Right: credits widget */}
          <div className={cn(
            'rounded-xl border p-3 min-w-[200px]',
            lowCredits ? 'border-amber-200 bg-amber-50' : 'border-neutral-200 bg-neutral-50',
          )}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn('text-xs font-semibold', lowCredits ? 'text-amber-700' : 'text-neutral-700')}>
                AI Credits
              </span>
              <span className={cn('text-sm font-bold', lowCredits ? 'text-amber-600' : 'text-neutral-900')}>
                {CREDITS_REMAINING}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className={cn('h-full rounded-full transition-all', lowCredits ? 'bg-amber-400' : 'bg-emerald-500')}
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
            <p className="mb-2 text-[10px] text-neutral-400 leading-relaxed">
              Credits are only used when your agent creates work for you.
            </p>
            <button
              type="button"
              onClick={() => toast.info('Credit packs are coming soon.')}
              className={cn(
                'w-full rounded-lg py-1.5 text-[11px] font-semibold transition-colors',
                lowCredits
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700',
              )}
            >
              Buy Credits
            </button>
          </div>
        </div>

        {/* Agent response message */}
        {agentMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-xs leading-relaxed text-emerald-800">{agentMessage}</p>
            </div>
          </div>
        )}

        {/* Prompt area */}
        <div className={cn(
          'rounded-2xl border-2 bg-white transition-all',
          running ? 'border-neutral-200 opacity-80' : 'border-neutral-200 focus-within:border-black',
        )}>
          <div className="flex items-start gap-3 px-4 pt-4 pb-2">
            <div className={cn(
              'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
              running ? 'bg-neutral-200' : 'bg-black',
            )}>
              {running
                ? <Loader2 size={15} className="animate-spin text-neutral-500" />
                : <Sparkles size={15} className="text-white" />}
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={running}
              placeholder="Describe what you want to sell or improve. SellBop can build your product page, launch plan, content, and next steps."
              rows={2}
              className="flex-1 resize-none bg-transparent py-0.5 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
            <span className="hidden text-[11px] text-neutral-400 sm:block">
              {running ? 'Agent is working…' : '⌘ Enter to run'}
            </span>
            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={!prompt.trim() || running}
              className={cn(
                'ml-auto flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                prompt.trim() && !running
                  ? 'bg-black text-white hover:bg-neutral-800 active:scale-95'
                  : 'cursor-not-allowed bg-neutral-100 text-neutral-400',
              )}
            >
              {running ? <><Loader2 size={13} className="animate-spin" /> Working…</> : <><Sparkles size={13} /> Run Agent</>}
            </button>
          </div>
        </div>

        {/* Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setPrompt(chip.prompt)}
              disabled={running}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-800 hover:bg-white hover:text-black disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recommendations + Activity ───────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

        {/* Recommendations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Recommended Next Actions
            </h2>
            <span className="text-[10px] text-neutral-400">Review, approve, and apply when ready.</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recommendations.slice(0, 4).map(rec => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
          {!hasRun && (
            <p className="mt-2 text-xs text-neutral-400">
              Run the agent with a prompt above to get personalised recommendations.
            </p>
          )}
        </div>

        {/* Agent Activity */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Agent Activity
          </h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black">Agent Activity</p>
                <p className="text-xs text-neutral-400">Live updates from your AI Store Agent.</p>
              </div>
              <ChevronRight size={14} className="text-neutral-300" />
            </div>
            <div className="space-y-3">
              {activity.map(item => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
