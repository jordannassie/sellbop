'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Layers } from 'lucide-react'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { cn } from '@/lib/utils'
import type { Storefront } from '@/lib/domain/entities'

interface StoreIdentityCardProps {
  /** Show the "View Store" external link. Default true. */
  showViewStore?: boolean
  /** Show the "Edit Store" link to Store Editor. Default true. */
  showEditorLink?: boolean
  /** Extra class applied to the outer wrapper. */
  className?: string
}

/**
 * Compact creator/store identity banner.
 *
 * - Left section (avatar + name + headline) is a Link to Store Profile for editing.
 * - Right section holds optional quick-action buttons.
 * - Avatar uses a rounded-square style (rounded-xl) for visual consistency.
 * - Reads live config so it reflects any saves made on Store Profile or Store Editor.
 */
export function StoreIdentityCard({
  showViewStore = true,
  showEditorLink = true,
  className,
}: StoreIdentityCardProps) {
  const [storefront, setStorefront] = useState<Storefront>(DEMO_STOREFRONT)

  useEffect(() => {
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      if (s) setStorefront(s as Storefront)
    })
  }, [])

  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`
  const showActions = showViewStore || showEditorLink

  return (
    <div className={cn(
      'bg-white border border-neutral-200 rounded-xl shadow-sm',
      'flex items-center gap-0 overflow-hidden',
      className,
    )}>

      {/* ── Left: clickable identity → Store Profile ─────────── */}
      <Link
        href="/dashboard/storefront"
        className={cn(
          'flex items-center gap-3.5 flex-1 min-w-0 px-4 sm:px-5 py-3.5',
          'hover:bg-neutral-50 transition-colors group',
        )}
        title="Edit Store Profile"
      >
        {/* Rounded-square avatar */}
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-base font-black select-none shadow-sm transition-transform group-hover:scale-[1.04]"
          style={{ backgroundColor: storefront.themeColor }}
          aria-hidden="true"
        >
          {storefront.title.charAt(0).toUpperCase()}
        </div>

        {/* Name + headline */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-black leading-tight truncate group-hover:text-neutral-700 transition-colors">
            {storefront.title}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 leading-tight truncate">
            {storefront.headline ?? `/store/${DEMO_SELLER_PROFILE.slug}`}
          </p>
        </div>
      </Link>

      {/* ── Right: quick-action buttons ──────────────────────── */}
      {showActions && (
        <div className="flex items-center gap-2 pr-3 sm:pr-4 shrink-0">
          {/* Separator */}
          <div className="w-px h-8 bg-neutral-100" />

          {/* View Store */}
          {showViewStore && (
            <Link
              href={storeUrl}
              target="_blank"
              title="View your public store"
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">View Store</span>
            </Link>
          )}

          {/* Edit Store (Store Editor) */}
          {showEditorLink && (
            <Link
              href="/dashboard/store-editor"
              title="Open Store Editor"
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              <Layers size={12} />
              <span className="hidden sm:inline">Edit Store</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
