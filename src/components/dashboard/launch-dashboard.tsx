'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Globe,
  Package,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { useLaunchChecklist } from '@/hooks/use-launch-checklist'
import type { ChecklistKey } from '@/hooks/use-launch-checklist'
import { cn } from '@/lib/utils'

// ── Checklist item definitions ────────────────────────────────────────────────

const CHECKLIST_ITEMS: {
  key: ChecklistKey
  label: string
  href: string
  description: string
}[] = [
  {
    key: 'storeCreated',
    label: 'Create your store',
    href: '/dashboard/storefront',
    description: 'Add your store name',
  },
  {
    key: 'headlineAdded',
    label: 'Add a store headline',
    href: '/dashboard/storefront',
    description: 'A one-line tagline for your store',
  },
  {
    key: 'bioAdded',
    label: 'Write your store bio',
    href: '/dashboard/storefront',
    description: 'Tell visitors who you are and what you offer',
  },
  {
    key: 'productCreated',
    label: 'Create your first product',
    href: '/dashboard/products/new',
    description: 'Add a digital product, service, or subscription',
  },
  {
    key: 'productPriced',
    label: 'Set a product price',
    href: '/dashboard/products',
    description: 'Add pricing to your product',
  },
  {
    key: 'productDescribed',
    label: 'Write a product description',
    href: '/dashboard/products',
    description: 'Help buyers understand what they get',
  },
  {
    key: 'productAccessAdded',
    label: 'Add product access',
    href: '/dashboard/products',
    description: 'Add a file, link, or access instructions',
  },
  {
    key: 'storePreviewViewed',
    label: 'Preview your store',
    href: '/dashboard/store-editor?section=preview',
    description: 'See how your store looks to visitors',
  },
  {
    key: 'storePublished',
    label: 'Publish your store',
    href: '/dashboard/store',
    description: 'Make your store live and shareable',
  },
  {
    key: 'storeLinkCopied',
    label: 'Share your store link',
    href: '#share',
    description: 'Copy and share your store URL',
  },
]

// ── CTA logic ─────────────────────────────────────────────────────────────────

interface NextCTA {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number }>
  isAI?: boolean
  isShare?: boolean
}

function getNextCTA(checklist: Record<ChecklistKey, boolean>): NextCTA {
  if (!checklist.storeCreated) return { label: 'Start with AI', href: '/dashboard/ai-launch', icon: Wand2, isAI: true }
  if (!checklist.productCreated) return { label: 'Create your first product', href: '/dashboard/ai-launch', icon: Package, isAI: true }
  if (!checklist.productAccessAdded) return { label: 'Add product access', href: '/dashboard/products', icon: Package }
  if (!checklist.storePreviewViewed) return { label: 'Preview your store', href: '/dashboard/store-editor?section=preview', icon: ExternalLink }
  if (!checklist.storePublished) return { label: 'Publish your store', href: '/dashboard/store', icon: Globe }
  return { label: 'Copy store link', href: '#share', icon: Copy, isShare: true }
}

// ── Launch Dashboard component ────────────────────────────────────────────────

interface LaunchDashboardProps {
  userName?: string
  onDismiss?: () => void
}

export function LaunchDashboard({ userName, onDismiss }: LaunchDashboardProps) {
  const router = useRouter()
  const { checklist, completedCount, totalCount, percentComplete, storefront, markComplete, refresh } = useLaunchChecklist()
  const [publishing, setPublishing] = useState(false)
  const [expandChecklist, setExpandChecklist] = useState(true)
  const [prompt, setPrompt] = useState('')

  const storeSlug = storefront?.slug ?? DEMO_SELLER_PROFILE.slug
  const storeLink = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${storeSlug}`
    : `/store/${storeSlug}`

  const nextCTA = getNextCTA(checklist)
  const incompleteItems = CHECKLIST_ITEMS.filter(item => !checklist[item.key])

  async function handlePublish() {
    setPublishing(true)
    try {
      const existing = await demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id)
      if (existing) {
        await demoStorefrontRepo.upsert({ ...existing, published: true })
        await refresh()
        toast.success('Store published! Share your link.')
      } else {
        toast.error('Complete your store profile first.')
      }
    } catch {
      toast.error('Failed to publish store.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    try {
      const existing = await demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id)
      if (existing) {
        await demoStorefrontRepo.upsert({ ...existing, published: false })
        await refresh()
        toast.success('Store unpublished.')
      }
    } catch {
      toast.error('Failed.')
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(storeLink)
    markComplete('storeLinkCopied')
    toast.success('Store link copied!')
  }

  function launchWithPrompt(text?: string) {
    const q = (text ?? prompt).trim()
    router.push(q ? `/dashboard/ai-launch?prompt=${encodeURIComponent(q)}` : '/dashboard/ai-launch')
  }

  const handleMarkPreview = useCallback(() => {
    markComplete('storePreviewViewed')
  }, [markComplete])

  return (
    <div className="mb-8 rounded-2xl border-2 border-black overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-black px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-white text-base leading-tight">AI Launch Coach</p>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 leading-none">
                Ready to help
              </span>
            </div>
            <p className="text-white/60 text-xs">
              Tell SellBop what you know, teach, or want to sell. Your AI Launch Coach will help you create the product, set the price, build the page, and plan your first sales.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-white/40 hover:text-white transition-colors shrink-0">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Progress bar ───────────────────────────────────────── */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-neutral-700">
            {completedCount} of {totalCount} steps complete
          </span>
          <span className="text-xs font-bold text-black">{percentComplete}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-black transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-5 space-y-5">
        {/* ── AI prompt ──────────────────────────────────────────── */}
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && launchWithPrompt()}
            placeholder="What do you want to create or sell today?"
            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-colors"
          />
          <Button onClick={() => launchWithPrompt()} size="sm">
            <Wand2 size={13} /> Start Launch
          </Button>
        </div>

        {/* ── Quick action chips ──────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {[
            'Help me find a product idea',
            'Build my product page',
            'Suggest my price',
            'Create my launch plan',
            'Help me get my first 10 sales',
          ].map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => launchWithPrompt(chip)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:border-black hover:bg-white hover:text-black transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── Primary CTA ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {nextCTA.isShare ? (
            <Button onClick={handleCopyLink}>
              <Copy size={14} /> {nextCTA.label}
            </Button>
          ) : (
            <Link href={nextCTA.href}>
              <Button>
                <nextCTA.icon size={14} /> {nextCTA.label} <ArrowRight size={12} />
              </Button>
            </Link>
          )}

          {/* Quick store actions */}
          {checklist.productCreated && !checklist.storePublished && (
            <Button variant="secondary" onClick={handlePublish} loading={publishing}>
              <Globe size={14} /> Publish Store
            </Button>
          )}
          {checklist.storePublished && (
            <>
              <Button variant="secondary" onClick={handleCopyLink}>
                <Copy size={14} /> Copy Link
              </Button>
              <Link href={`/store/${storeSlug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <ExternalLink size={13} /> View Store
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Checklist ──────────────────────────────────────────── */}
        {incompleteItems.length > 0 && (
          <div>
            <button
              onClick={() => setExpandChecklist(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black transition-colors mb-2"
            >
              <ClipboardCheck size={13} />
              Launch Checklist
              <span className="text-neutral-400 font-normal">— {incompleteItems.length} step{incompleteItems.length === 1 ? '' : 's'} remaining</span>
            </button>

            {expandChecklist && (
              <div className="space-y-1 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                {CHECKLIST_ITEMS.map(item => {
                  const done = checklist[item.key]
                  return (
                    <div key={item.key} className="flex items-center gap-2.5 py-1">
                      {done ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={15} className="text-neutral-300 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-xs font-medium', done ? 'text-neutral-400 line-through' : 'text-neutral-700')}>
                          {item.label}
                        </span>
                      </div>
                      {!done && (
                        <Link
                          href={item.href}
                          onClick={item.key === 'storePreviewViewed' ? handleMarkPreview : undefined}
                          className="shrink-0 text-[11px] font-medium text-neutral-500 hover:text-black underline underline-offset-2 transition-colors"
                        >
                          Do it →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Published share bar ────────────────────────────────── */}
        {checklist.storePublished && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <Globe size={14} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 flex-1 truncate font-medium">
              Live at <a href={storeLink} target="_blank" className="underline">{storeLink}</a>
            </p>
            <Button size="xs" variant="ghost" onClick={handleCopyLink} className="text-emerald-700 hover:bg-emerald-100 shrink-0">
              <Copy size={11} /> Copy
            </Button>
            <Button size="xs" variant="ghost" onClick={handleUnpublish} className="text-neutral-500 hover:bg-red-50 hover:text-red-600 shrink-0">
              Unpublish
            </Button>
          </div>
        )}
      </div>

      {/* ── Quick nav ──────────────────────────────────────────── */}
      <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-3 flex flex-wrap gap-3">
        <Link href="/dashboard/ai-launch" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors">
          <Wand2 size={11} /> Create with AI
        </Link>
        <Link href="/dashboard/products/new" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors">
          <Package size={11} /> Create manually
        </Link>
        <Link href="/dashboard/store-editor" onClick={handleMarkPreview} className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors">
          <ExternalLink size={11} /> Preview store
        </Link>
      </div>
    </div>
  )
}

// Re-export ClipboardCheck since Lucide doesn't include it
function ClipboardCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}
