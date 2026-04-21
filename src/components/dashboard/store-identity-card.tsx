'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Layers } from 'lucide-react'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { cn } from '@/lib/utils'
import type { Storefront } from '@/lib/domain/entities'

interface StoreIdentityCardProps {
  /** Show the "View Store" link. Default true. */
  showViewStore?: boolean
  /** Show the "Edit Store" link to Store Editor. Default true. */
  showEditorLink?: boolean
  /** Extra class applied to the outer wrapper. */
  className?: string
}

/**
 * Compact creator/store identity banner.
 * Reads live config from demoStorefrontRepo so it reflects saved changes.
 * Renders an avatar, store name, headline, and optional quick-action links.
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

  const storeUrl      = `/store/${DEMO_SELLER_PROFILE.slug}`
  const displaySlug   = `/store/${DEMO_SELLER_PROFILE.slug}`
  const showingActions = showViewStore || showEditorLink

  return (
    <div className={cn(
      'bg-white border border-neutral-200 rounded-xl shadow-sm',
      'flex items-center gap-3.5 px-4 sm:px-5 py-3.5',
      className,
    )}>

      {/* Avatar — coloured circle using accent theme */}
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-black select-none"
        style={{ backgroundColor: storefront.themeColor }}
        aria-hidden="true"
      >
        {storefront.title.charAt(0).toUpperCase()}
      </div>

      {/* Store identity */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-black leading-tight truncate">
          {storefront.title}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5 leading-tight truncate">
          {storefront.headline ?? displaySlug}
        </p>
      </div>

      {/* Quick actions */}
      {showingActions && (
        <div className="flex items-center gap-2 shrink-0">
          {/* View Store — icon only on mobile, icon + label on sm+ */}
          {showViewStore && (
            <Link
              href={storeUrl}
              target="_blank"
              title="View your public store"
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">View Store</span>
            </Link>
          )}

          {/* Edit Store — always visible, compact */}
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
