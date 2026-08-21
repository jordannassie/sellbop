'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'
import type { ProductIdea } from '@/lib/product-ideas/types'
import { productFitLabel, youtubeDemandLabel } from '@/lib/product-ideas/types'
import {
  buildEvidenceChips,
  formatBreakoutRatio,
  opportunityScoreTone,
  sourceBadgeLabel,
} from '@/lib/product-ideas/scoring'
import { buildLaunchUrl } from '@/lib/product-ideas/launch-url'

function formatPrice(minCents: number, maxCents: number): string {
  const min = Math.round(minCents / 100)
  const max = Math.round(maxCents / 100)
  return `$${min}–$${max}`
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function formatDate(iso: string): string {
  if (!iso) return 'Unknown date'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Unknown date'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
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

function SourcePill({ label, variant }: { label: string; variant: 'data' | 'ai' | 'trend' | 'sellbop' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        variant === 'data' && 'bg-red-50 text-red-700 border border-red-100',
        variant === 'ai' && 'bg-violet-50 text-violet-700 border border-violet-100',
        variant === 'trend' && 'bg-blue-50 text-blue-700 border border-blue-100',
        variant === 'sellbop' && 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      )}
    >
      {label}
    </span>
  )
}

function ResearchPanel({ idea }: { idea: ProductIdea }) {
  const r = idea.research
  const youtube = r?.youtube
  const queries = r?.queries ?? []
  const productFit = r?.productFit
  const trends = r?.trends
  const sellbop = r?.sellbop

  const hasContent = youtube?.available || queries.length > 0 || productFit?.available || sellbop?.available

  if (!hasContent) {
    return <p className="text-sm text-neutral-500">No verified research data for this idea yet.</p>
  }

  return (
    <div className="space-y-5">
      {youtube?.available && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Audience Evidence</h4>
            <SourcePill label="YouTube Data" variant="data" />
          </div>
          {youtube.youtubeDemandScore != null && (
            <p className="text-sm text-neutral-600 mb-2">
              YouTube demand: {youtubeDemandLabel(youtube.youtubeDemandScore)} ({youtube.youtubeDemandScore}/100)
              {youtube.breakoutVideoCount > 0 && (
                <> · {youtube.breakoutVideoCount} breakout video{youtube.breakoutVideoCount !== 1 ? 's' : ''}</>
              )}
            </p>
          )}
          {youtube.examples.length > 0 ? (
            <ul className="space-y-3">
              {youtube.examples.map(v => (
                <li key={v.videoId} className="text-sm border border-neutral-100 rounded-lg p-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 font-medium hover:underline inline-flex items-start gap-1"
                  >
                    {v.title}
                    <ExternalLink size={12} className="text-neutral-400 mt-1 flex-shrink-0" />
                  </a>
                  <p className="text-xs text-neutral-500 mt-1">{v.channelTitle}</p>
                  <ul className="text-xs text-neutral-600 mt-1 space-y-0.5">
                    {v.views != null && <li>Views: {formatCount(v.views)}</li>}
                    {v.channelSubscribers != null && <li>Subscribers: {formatCount(v.channelSubscribers)}</li>}
                    {v.breakoutRatio != null && (
                      <li>Breakout ratio: {formatBreakoutRatio(v.breakoutRatio)}</li>
                    )}
                    <li>Published: {formatDate(v.publishedAt)}</li>
                  </ul>
                  <p className="text-[10px] text-neutral-400 mt-2">Sample video — not an endorsement of SellBop.</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No representative videos captured.</p>
          )}
        </section>
      )}

      {queries.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Related Problems</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {queries.slice(0, 10).map(q => (
              <li key={q.query} className="flex items-center gap-2 flex-wrap">
                <span>{q.query}</span>
                <SourcePill
                  label={q.source === 'autocomplete' ? 'Discovered' : q.source === 'youtube' ? 'YouTube Data' : 'AI'}
                  variant={q.source === 'autocomplete' ? 'data' : 'ai'}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {trends?.available && trends.matched && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Google Trend</h4>
            <SourcePill label="Google Trend" variant="trend" />
          </div>
          <p className="text-sm text-neutral-600">
            Currently trending{trends.searchTier ? `: ${trends.searchTier} searches` : ''}
          </p>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Product Opportunity</h4>
          {productFit?.available && <SourcePill label="AI Assessment" variant="ai" />}
        </div>
        <ul className="text-sm text-neutral-600 space-y-1">
          <li><span className="font-medium text-neutral-700">Target buyer:</span> {idea.targetAudience}</li>
          <li><span className="font-medium text-neutral-700">Format:</span> {idea.productType}</li>
          <li>
            <span className="font-medium text-neutral-700">Suggested price:</span>{' '}
            {formatPrice(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents)}
          </li>
          {productFit?.available && productFit.level !== 'unknown' && (
            <li>
              <span className="font-medium text-neutral-700">Product Fit:</span>{' '}
              {productFitLabel(productFit.level)}
              {productFit.reason && <> — {productFit.reason}</>}
            </li>
          )}
        </ul>
        {idea.productContents.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-neutral-500 mb-1">Recommended contents</p>
            <ul className="list-disc pl-5 text-sm space-y-0.5">
              {idea.productContents.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {sellbop?.available && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">SellBop Data</h4>
            <SourcePill label="SellBop Data" variant="sellbop" />
          </div>
          <p className="text-sm text-neutral-600">{sellbop.summary}</p>
        </section>
      )}
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
  const tone = opportunityScoreTone(idea.opportunityScore)
  const evidenceChips = buildEvidenceChips(idea.research)
  const sourceBadge = sourceBadgeLabel(idea.source)
  const hasValidatedScore = idea.source === 'youtube_data' && idea.opportunityScore != null

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-black leading-snug">{idea.title}</h3>
          <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{idea.hook}</p>
        </div>
        {idea.opportunityScore != null && (
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
                {idea.opportunityScore}
              </p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Opportunity</p>
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
            idea.source === 'youtube_data'
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-neutral-100 text-neutral-600 border border-neutral-200',
          )}
        >
          {sourceBadge}
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

      {(hasValidatedScore || idea.source === 'ai_estimate') && (
        <p className="flex items-start gap-1.5 text-xs text-neutral-400 mb-4">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          {hasValidatedScore
            ? 'Score combines YouTube audience evidence with AI product-fit assessment. It does not guarantee sales.'
            : 'AI Estimate — no validated YouTube market data. Add YOUTUBE_API_KEY for evidence-based scoring.'}
        </p>
      )}

      <CollapsibleSection title="Why SellBop likes this">
        <p>{idea.whyItCouldSell}</p>
      </CollapsibleSection>

      <CollapsibleSection title="View Research">
        <ResearchPanel idea={idea} />
      </CollapsibleSection>

      <div className="mt-auto pt-5 flex flex-wrap items-center gap-2">
        <Link href={buildLaunchUrl(idea)} className="flex-1 min-w-[200px]">
          <Button className="w-full font-semibold">
            Build This Product with AI <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
        {onSave && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={saving}
            disabled={saved}
            onClick={onSave}
          >
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
  'Finding problems people care about',
  'Checking YouTube audience interest',
  'Looking for breakout videos',
  'Assessing product fit',
  'Turning research into products',
]

export function ProductIdeasLoading() {
  const [index] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length))
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
      <Loader2 size={28} className="mx-auto animate-spin text-neutral-400 mb-4" />
      <p className="text-lg font-semibold text-black">Finding real opportunities...</p>
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
