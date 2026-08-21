'use client'

import { useState } from 'react'
import {
  Bookmark,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'
import type { ProductIdea } from '@/lib/product-ideas/types'
import { productFitLabel } from '@/lib/product-ideas/types'
import {
  buildEvidenceChips,
  formatTrendingTraffic,
  opportunityScoreTone,
  scoreDisplay,
  sourceBadgeLabel,
} from '@/lib/product-ideas/scoring'
import { buildClaudePrompt } from '@/lib/product-ideas/claude-prompt'
import { toast } from 'sonner'

function formatPrice(minCents: number, maxCents: number): string {
  const min = Math.round(minCents / 100)
  const max = Math.round(maxCents / 100)
  return `$${min}–$${max}`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-neutral-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-neutral-700"
      >
        {title}
        <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2 text-sm text-neutral-600 leading-relaxed space-y-2">{children}</div>}
    </div>
  )
}

function SourcePill({ label, variant }: { label: string; variant: 'trends' | 'ai' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        variant === 'trends' && 'bg-blue-50 text-blue-700 border border-blue-100',
        variant === 'ai' && 'bg-violet-50 text-violet-700 border border-violet-100',
      )}
    >
      {label}
    </span>
  )
}

function ResearchPanel({ idea }: { idea: ProductIdea }) {
  const trend = idea.research?.trendResearch
  const isTrendBacked = idea.source === 'google_trends' || idea.source === 'google_trends_youtube'

  if (!isTrendBacked && !idea.research?.productFitScore) {
    return <p className="text-sm text-neutral-500">AI-generated estimate — no verified Google Trends match.</p>
  }

  return (
    <div className="space-y-4">
      {isTrendBacked && trend && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Google Trend</h4>
            <SourcePill label="Google Trends" variant="trends" />
          </div>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li><span className="font-medium text-neutral-700">Trend query:</span> {trend.query}</li>
            {trend.trafficLabel && (
              <li><span className="font-medium text-neutral-700">Search activity:</span> {formatTrendingTraffic(trend.trafficLabel)}</li>
            )}
            <li><span className="font-medium text-neutral-700">Detected:</span> {formatDate(trend.publishedAt)}</li>
          </ul>
          {idea.whyItCouldSell && (
            <p className="text-sm text-neutral-600 mt-2">
              <span className="font-medium text-neutral-700">Why it may become a product:</span> {idea.whyItCouldSell}
            </p>
          )}
          <a
            href={trend.exploreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline mt-2"
          >
            View on Google Trends <ExternalLink size={12} />
          </a>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Product Opportunity</h4>
          <SourcePill label="AI Assessment" variant="ai" />
        </div>
        <ul className="text-sm text-neutral-600 space-y-1">
          <li><span className="font-medium text-neutral-700">Target buyer:</span> {idea.targetAudience}</li>
          <li><span className="font-medium text-neutral-700">Format:</span> {idea.productType}</li>
          <li><span className="font-medium text-neutral-700">Suggested price:</span> {formatPrice(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents)}</li>
          {idea.research?.productFitScore != null && (
            <li><span className="font-medium text-neutral-700">Product Fit:</span> {productFitLabel(idea.research.productFitScore)}</li>
          )}
        </ul>
        {idea.productContents.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-neutral-500 mb-1">Suggested contents</p>
            <ul className="list-disc pl-5 text-sm space-y-0.5">
              {idea.productContents.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

export function ProductIdeaCard({
  idea,
  onSave,
  saving,
  saved,
  onRemove,
  removing,
}: {
  idea: ProductIdea
  onSave?: () => void
  saving?: boolean
  saved?: boolean
  onRemove?: () => void
  removing?: boolean
}) {
  const [copying, setCopying] = useState(false)
  const scoreMeta = scoreDisplay(idea)
  const tone = opportunityScoreTone(scoreMeta.value)
  const evidenceChips = buildEvidenceChips(idea)
  const isTrendBacked = idea.source === 'google_trends' || idea.source === 'google_trends_youtube'

  async function handleCopyForClaude() {
    setCopying(true)
    try {
      const prompt = buildClaudePrompt(idea)
      await navigator.clipboard.writeText(prompt)
      toast.success('Copied for Claude', {
        description: 'Paste it into Claude to build the product.',
      })
    } catch {
      toast.error("Couldn't copy. Please try again.")
    } finally {
      setCopying(false)
    }
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-black leading-snug">{idea.title}</h3>
          <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{idea.hook}</p>
        </div>
        {scoreMeta.value != null && (
          <div className="flex-shrink-0 text-center">
            <div
              className={cn(
                'rounded-xl px-3 py-2 min-w-[72px]',
                tone === 'high' && 'bg-emerald-50 border border-emerald-100',
                tone === 'medium' && 'bg-neutral-50 border border-neutral-200',
                tone === 'neutral' && 'bg-neutral-50 border border-neutral-200',
              )}
            >
              <p className={cn('text-xl font-bold', tone === 'high' ? 'text-emerald-700' : 'text-black')}>
                {scoreMeta.value}
              </p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{scoreMeta.label}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
        <User size={13} />
        <span>{idea.targetAudience}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {idea.productType}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            isTrendBacked
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-neutral-100 text-neutral-600 border border-neutral-200',
          )}
        >
          {sourceBadgeLabel(idea.source)}
        </span>
      </div>

      <p className="text-sm font-medium text-black mb-3">
        Suggested price: {formatPrice(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents)}
      </p>

      {evidenceChips.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">Evidence</p>
          <div className="flex flex-wrap gap-2">
            {evidenceChips.map(chip => (
              <span
                key={chip}
                className="rounded-full bg-neutral-50 border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-neutral-400 mb-4">
        <Info size={12} className="mt-0.5 flex-shrink-0" />
        {scoreMeta.tooltip}
      </p>

      <CollapsibleSection title="Why SellBop likes this">
        <p>{idea.whyItCouldSell}</p>
      </CollapsibleSection>

      <CollapsibleSection title="View Research">
        <ResearchPanel idea={idea} />
      </CollapsibleSection>

      <div className="mt-auto pt-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="flex-1 min-w-[160px] font-semibold"
          loading={copying}
          onClick={() => void handleCopyForClaude()}
        >
          <Sparkles size={14} className="mr-1.5" />
          Copy for Claude
        </Button>
        {onSave && (
          <Button type="button" variant="secondary" size="sm" loading={saving} disabled={saved} onClick={onSave}>
            <Bookmark size={14} className="mr-1" />
            {saved ? 'Saved' : 'Save'}
          </Button>
        )}
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" loading={removing} onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </article>
  )
}

const LOADING_MESSAGES = [
  'Checking what\'s trending',
  'Finding useful demand signals',
  'Filtering out news-only trends',
  'Turning trends into product ideas',
]

export function ProductIdeasLoading() {
  const [index] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length))
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
      <Loader2 size={28} className="mx-auto animate-spin text-neutral-400 mb-4" />
      <p className="text-lg font-semibold text-black">Searching Google Trends...</p>
      <p className="text-sm text-neutral-500 mt-2">{LOADING_MESSAGES[index]}</p>
    </div>
  )
}

export const EXAMPLE_CATEGORY_CHIPS = [
  { label: 'Real Estate', category: 'Real Estate' },
  { label: 'Fitness', category: 'Health & Fitness' },
  { label: 'AI & Technology', category: 'Tech & AI' },
  { label: 'Business', category: 'Business & Marketing' },
  { label: 'Personal Finance', category: 'Money & Finance' },
  { label: 'Education', category: 'Education & Career' },
] as const

export const COUNT_OPTIONS = [
  { value: '5', label: '5 ideas' },
  { value: '10', label: '10 ideas' },
  { value: '15', label: '15 ideas' },
]

export const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map(c => ({ value: c, label: c }))
