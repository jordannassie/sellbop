'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { LinkField } from '@/components/dashboard/link-field'
import {
  ArrowUpRight,
  Check,
  Copy,
  EyeOff,
  Globe,
  ImageIcon,
  Layers,
  LayoutTemplate,
  Palette,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Storefront } from '@/lib/domain/entities'

interface SectionCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  cta: string
  highlight?: boolean
}

const CARDS: SectionCard[] = [
  {
    title: 'Store Profile',
    description: 'Edit your store name, bio, social links, and avatar.',
    href: '/dashboard/storefront',
    icon: User,
    cta: 'Edit Profile',
  },
  {
    title: 'Store Editor',
    description: 'Customize your store layout, featured products, and design.',
    href: '/dashboard/store-editor',
    icon: Layers,
    cta: 'Open Editor',
    highlight: true,
  },
  {
    title: 'Theme & Design',
    description: 'Change colors, button styles, card layout, and density.',
    href: '/dashboard/store-editor?section=design',
    icon: Palette,
    cta: 'Customize',
  },
  {
    title: 'Banner & Media',
    description: 'Add a banner image or header media to your store.',
    href: '/dashboard/storefront',
    icon: ImageIcon,
    cta: 'Set Banner',
  },
  {
    title: 'Page Layout',
    description: 'Control section order, visibility, and header style.',
    href: '/dashboard/store-editor?section=sections',
    icon: LayoutTemplate,
    cta: 'Edit Layout',
  },
]

export default function StoreSectionPage() {
  const { session } = useAuth()
  const { store: userStore, isDemo, saveStore } = useUserStore()

  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [publishing, setPublishing]     = useState(false)
  const [copied, setCopied]             = useState(false)
  const [storeLink, setStoreLink]       = useState('')   // confirmed-available slug draft
  const [savingLink, setSavingLink]     = useState(false)
  const initialized = useRef(false)

  // Seed storeLink once when the store first loads (avoids reset on refetch)
  useEffect(() => {
    if (!userStore || initialized.current) return
    initialized.current = true
    setStoreLink(userStore.slug)
  }, [userStore])

  // Active slug — what the Copy/Open/Preview buttons should use
  const activeSlug = storeLink || userStore?.slug || DEMO_SELLER_PROFILE.slug

  // ownerParam for availability API: current user can keep their own link
  const storeLinkOwnerParam = {
    key: 'ownerId',
    value: session?.userId ?? DEMO_SELLER_PROFILE.userId,
  }

  async function loadStorefront() {
    const s = await demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id)
    if (s) setStorefront(s as Storefront)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStorefront()
  }, [])

  async function handleSaveLink() {
    if (!storeLink || storeLink === userStore?.slug) return
    setSavingLink(true)
    try {
      // Persist to Supabase (when authenticated)
      if (!isDemo) {
        const err = await saveStore({ slug: storeLink })
        if (err) { toast.error(`Could not save: ${err}`); return }
      }

      // Keep localStorage in sync for the demo / UI layer
      if (storefront) {
        await demoStorefrontRepo.upsert({ ...storefront, slug: storeLink })
        await loadStorefront()
      }

      toast.success('Store link updated!')
    } catch {
      toast.error('Failed to save store link.')
    } finally {
      setSavingLink(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      if (!storefront) { toast.error('Complete your store profile first.'); return }
      await demoStorefrontRepo.upsert({ ...storefront, published: true })
      await loadStorefront()
      toast.success('Store published! Your store is now live.')
    } catch {
      toast.error('Failed to publish store.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    try {
      if (!storefront) return
      await demoStorefrontRepo.upsert({ ...storefront, published: false })
      await loadStorefront()
      toast.success('Store unpublished.')
    } catch {
      toast.error('Failed.')
    }
  }

  function handleCopyLink() {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/store/${activeSlug}`
      : `/store/${activeSlug}`
    void navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Store link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const isPublished = storefront?.published ?? false

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-black">Store</h1>
            <Badge variant={isPublished ? 'success' : 'neutral'}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">
            {isPublished
              ? 'Your store is live and discoverable.'
              : 'Your store is in draft — not yet public.'}
          </p>
        </div>
        <Link href={`/store/${activeSlug}`} target="_blank">
          <Button variant="secondary" size="sm">
            <Globe size={13} /> Preview <ArrowUpRight size={12} />
          </Button>
        </Link>
      </div>

      {/* Publish controls */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
            <div>
              <p className="text-sm font-semibold text-black">
                {isPublished ? 'Store is live' : 'Store is in draft'}
              </p>
              <p className="text-xs text-neutral-500">
                {isPublished
                  ? `Public at /store/${activeSlug}`
                  : 'Publish to make your store visible and shareable'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isPublished ? (
              <Button onClick={handlePublish} loading={publishing} size="sm">
                <Globe size={13} /> Publish Store
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleUnpublish}>
                  <EyeOff size={13} /> Unpublish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Editable store link ──────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-black">Store link</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy link"
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <Link href={`/store/${activeSlug}`} target="_blank">
              <button
                type="button"
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <ArrowUpRight size={11} /> Open
              </button>
            </Link>
          </div>
        </div>

        <LinkField
          value={storeLink}
          onChange={setStoreLink}
          prefix="sellbop.com/store/"
          checkUrl="/api/availability/store-link"
          ownerParam={storeLinkOwnerParam}
          label=""
        />

        <p className="text-xs text-neutral-400">
          Choose a short link people can remember. Letters, numbers, and dashes only.
        </p>

        <Button
          type="button"
          size="sm"
          loading={savingLink}
          disabled={!storeLink || storeLink === (userStore?.slug ?? DEMO_SELLER_PROFILE.slug)}
          onClick={handleSaveLink}
        >
          Save store link
        </Button>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map(card => (
          <Link key={card.href} href={card.href}>
            <div
              className={`group rounded-2xl border p-5 transition-all hover:shadow-sm hover:border-neutral-300 ${
                card.highlight
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    card.highlight ? 'bg-white/10' : 'bg-neutral-100'
                  }`}
                >
                  <card.icon
                    size={17}
                    className={card.highlight ? 'text-white' : 'text-neutral-600'}
                  />
                </div>
                <p
                  className={`font-semibold text-sm ${
                    card.highlight ? 'text-white' : 'text-black'
                  }`}
                >
                  {card.title}
                </p>
              </div>
              <p
                className={`text-xs leading-relaxed mb-4 ${
                  card.highlight ? 'text-white/70' : 'text-neutral-500'
                }`}
              >
                {card.description}
              </p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  card.highlight
                    ? 'text-white/90 group-hover:text-white'
                    : 'text-neutral-700 group-hover:text-black'
                }`}
              >
                {card.cta} <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
