'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import {
  ArrowUpRight,
  Globe,
  ImageIcon,
  Layers,
  LayoutTemplate,
  Palette,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [storeSlug, setStoreSlug] = useState(DEMO_SELLER_PROFILE.slug)

  useEffect(() => {
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      if (s?.slug) setStoreSlug(s.slug)
    })
  }, [])

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Store</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Your public storefront and design settings.
          </p>
        </div>
        <Link href={`/store/${storeSlug}`} target="_blank">
          <Button variant="secondary" size="sm">
            <Globe size={13} /> Open Store <ArrowUpRight size={12} />
          </Button>
        </Link>
      </div>

      {/* Store URL */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <Globe size={14} className="shrink-0 text-neutral-400" />
        <a
          href={`/store/${storeSlug}`}
          target="_blank"
          className="flex-1 truncate text-sm text-neutral-600 hover:text-black transition-colors"
        >
          sellbop.com/store/{storeSlug}
        </a>
        <Link href={`/store/${storeSlug}`} target="_blank">
          <ArrowUpRight size={14} className="text-neutral-400 hover:text-black transition-colors" />
        </Link>
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
