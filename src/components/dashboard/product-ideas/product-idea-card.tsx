'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Info,
  Loader2,
  Search,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'
import type { ProductIdea } from '@/lib/product-ideas/types'
import {
  competitionLabel,
  demandLabel,
  opportunityScoreTone,
  trendLabel,
} from '@/lib/product-ideas/scoring'
import { buildLaunchUrl } from '@/lib/product-ideas/launch-url'
import { toast } from 'sonner'

function formatPrice(minCents: number, maxCents: number): string {
  const min = Math.round(minCents / 100)
  const max = Math.round(maxCents / 100)
  return `$${min}–$${max}`
}

function formatSearches(value: number): string {
  return value.toLocaleString('en-US')
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
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
      {open && <div className="mt-2 text-sm text-neutral-600 leading-relaxed">{children}</div>}
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
  const badges = [
    idea.source === 'search_data' ? 'Search Data' : 'AI Estimate',
    demandLabel(idea.estimatedMonthlySearches),
    trendLabel(idea.trend),
    competitionLabel(idea.searchCompetition),
  ].filter(Boolean) as string[]

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
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Score</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
        <User size={13} />
        <span>{idea.targetAudience}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {idea.productType}
        </span>
        {badges.map(badge => (
          <span
            key={badge}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              badge === 'Search Data'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : badge === 'AI Estimate'
                  ? 'bg-neutral-100 text-neutral-600'
                  : 'bg-white text-neutral-600 border border-neutral-200',
            )}
          >
            {badge}
          </span>
        ))}
      </div>

      <p className="text-sm font-medium text-black mb-3">
        Suggested price: {formatPrice(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents)}
      </p>

      {idea.estimatedMonthlySearches != null && (
        <p className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
          <Search size={14} className="text-neutral-400" />
          ~{formatSearches(idea.estimatedMonthlySearches)} estimated searches/mo
        </p>
      )}

      {idea.opportunityScore != null && (
        <p className="flex items-start gap-1.5 text-xs text-neutral-400 mb-4">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          Based on estimated search demand, trend, commercial intent, and search competition. It does not guarantee sales.
        </p>
      )}

      <CollapsibleSection title="Why this opportunity?">
        <p>{idea.whyItCouldSell}</p>
      </CollapsibleSection>

      {(idea.supportingKeywords.length > 0 || idea.primaryKeyword) && (
        <CollapsibleSection title="Related searches">
          <ul className="list-disc pl-5 space-y-1">
            {[idea.primaryKeyword, ...idea.supportingKeywords]
              .filter(Boolean)
              .slice(0, 5)
              .map(kw => (
                <li key={kw}>{kw}</li>
              ))}
          </ul>
        </CollapsibleSection>
      )}

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
  'Looking for what people search for',
  'Measuring demand',
  'Finding rising problems',
  'Turning searches into products',
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
