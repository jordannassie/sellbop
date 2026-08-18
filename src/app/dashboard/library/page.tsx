'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, Copy, Download, ExternalLink, Loader2, Share2, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { ProductCardImage } from '@/components/product/product-card-image'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LibraryItem {
  purchaseId: string
  productId: string
  orderId: string
  productTitle: string
  productSlug: string | null
  coverImage: string | null
  priceCents: number
  creatorName: string | null
  creatorSlug: string | null
  purchasedAt: string
  accessUrl: string | null
  affiliateEnabled?: boolean
  affiliateCommissionPercent?: number | null
}

function AccessProductButton({ accessUrl }: { accessUrl: string | null }) {
  if (!accessUrl) {
    return <p className="text-xs text-neutral-400">Access link unavailable.</p>
  }

  return (
    <Link
      href={accessUrl}
      className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
    >
      <Download size={12} />
      Access Product
    </Link>
  )
}

function ShareEarnButton({ productId, productSlug, commissionPercent, priceCents }: {
  productId: string
  productSlug: string | null
  commissionPercent: number
  priceCents: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [affiliateUrl, setAffiliateUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const commCents = Math.floor(priceCents * (commissionPercent / 100))

  async function handleOpen() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (affiliateUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.relationship) {
        const appUrl = window.location.origin
        setAffiliateUrl(`${appUrl}/p/${productSlug}?ref=${data.relationship.referral_code}`)
      }
    } catch { /* noop */ } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!affiliateUrl) return
    await navigator.clipboard.writeText(affiliateUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleShare() {
    if (!affiliateUrl) return
    if (navigator.share) {
      try { await navigator.share({ url: affiliateUrl }) } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <button
        onClick={handleOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm hover:bg-emerald-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-600" />
          <span className="font-semibold text-emerald-800">
            Earn {commissionPercent}% · {formatCurrency(commCents)}/sale
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-600">{expanded ? 'Hide' : 'Share & Earn'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 size={16} className="animate-spin text-neutral-400" />
            </div>
          ) : affiliateUrl ? (
            <>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <p className="truncate text-[11px] font-mono text-neutral-500">{affiliateUrl}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? `Copied! Earn ${formatCurrency(commCents)}/sale` : 'COPY LINK'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-red-600">Failed to get your affiliate link. Please try again.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    fetch('/api/library')
      .then(res => res.json())
      .then(data => {
        setItems(data.items ?? [])
      })
      .catch(() => setError('Failed to load your library.'))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Library</h1>
        <p className="mt-1 text-sm text-neutral-500">Your purchased products, ready to download.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white py-20 text-center">
          <BookOpen size={40} className="mb-4 text-neutral-300" />
          <h3 className="text-lg font-semibold text-neutral-800">Your library is empty</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            Products you purchase will appear here. Browse the marketplace or get a product link from a creator.
          </p>
          <Link
            href="/marketplace"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const commPercent = item.affiliateCommissionPercent ?? 0
            const showShareEarn = item.affiliateEnabled && commPercent > 0 && item.priceCents > 0 && item.productSlug
            return (
              <div
                key={item.purchaseId}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cover image */}
                <ProductCardImage src={item.coverImage} alt={item.productTitle} />

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-neutral-900 leading-tight line-clamp-2">{item.productTitle}</h3>

                  {item.creatorName && (
                    <p className="mt-1 text-xs text-neutral-500">
                      by{' '}
                      {item.creatorSlug ? (
                        <Link href={`/store/${item.creatorSlug}`} className="hover:text-black hover:underline">
                          {item.creatorName}
                        </Link>
                      ) : (
                        item.creatorName
                      )}
                    </p>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                    <span>{item.priceCents === 0 ? 'Free' : formatCurrency(item.priceCents)}</span>
                    <span>·</span>
                    <span>Purchased {formatDate(item.purchasedAt)}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <AccessProductButton accessUrl={item.accessUrl} />
                    {item.productSlug && (
                      <Link
                        href={`/p/${item.productSlug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                        View
                      </Link>
                    )}
                  </div>

                  {showShareEarn && (
                    <ShareEarnButton
                      productId={item.productId}
                      productSlug={item.productSlug}
                      commissionPercent={commPercent}
                      priceCents={item.priceCents}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
