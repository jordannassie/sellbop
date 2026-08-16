'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/auth-context'
import { formatCurrency } from '@/lib/utils'
import { Check, Copy, ExternalLink, Loader2, Share2, TrendingUp, Users } from 'lucide-react'

type Tab = 'promoting' | 'network'

// ── Shared copy-link button ────────────────────────────────────────────────────
function CopyLinkButton({ url, commCents }: { url: string; commCents: number }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'Check this out on Sellbop' })
      } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <span className="flex-1 truncate text-[11px] font-mono text-neutral-500">{url}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-black text-white hover:bg-neutral-800'
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
    </div>
  )
}

// ── Promoting tab ─────────────────────────────────────────────────────────────
interface PromotingItem {
  relationshipId: string
  referralCode: string
  productId: string
  productTitle: string
  productSlug: string | null
  coverImage: string | null
  priceCents: number
  commissionPercent: number
  commissionPerSaleCents: number
  affiliateUrl: string
  clicks: number
  sales: number
  earnedCents: number
  affiliateEnabled: boolean
}

function PromotingTab() {
  const [items, setItems] = useState<PromotingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/affiliates/promoting')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>

  const totalEarned = items.reduce((s, i) => s + i.earnedCents, 0)
  const totalSales = items.reduce((s, i) => s + i.sales, 0)
  const totalClicks = items.reduce((s, i) => s + i.clicks, 0)

  return (
    <div>
      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Earned', value: formatCurrency(totalEarned) },
            { label: 'Sales', value: totalSales.toString() },
            { label: 'Clicks', value: totalClicks.toString() },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-lg font-bold text-black">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white py-20 text-center">
          <TrendingUp size={40} className="mb-4 text-neutral-300" />
          <h3 className="text-lg font-semibold text-neutral-800">You&apos;re not promoting anything yet.</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            Discover an affiliate-enabled product and click Promote &amp; Earn to get your link.
          </p>
          <Link
            href="/marketplace"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.relationshipId} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex gap-4 items-start">
                {item.coverImage ? (
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                    <Image src={item.coverImage} alt={item.productTitle} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <span className="text-2xl font-black text-neutral-300">{item.productTitle.charAt(0)}</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-neutral-900 leading-tight line-clamp-2">{item.productTitle}</h3>
                    {item.productSlug && (
                      <Link href={`/p/${item.productSlug}`} className="flex-shrink-0 text-neutral-400 hover:text-black">
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                      {item.commissionPercent}% · {formatCurrency(item.commissionPerSaleCents)}/sale
                    </span>
                    <span>{item.clicks} clicks</span>
                    <span>{item.sales} sales</span>
                    <span className="font-semibold text-black">{formatCurrency(item.earnedCents)} earned</span>
                  </div>

                  {!item.affiliateEnabled && (
                    <p className="mt-1 text-xs text-amber-600">⚠ Seller has disabled affiliate sharing for this product.</p>
                  )}
                </div>
              </div>

              {item.affiliateEnabled && (
                <CopyLinkButton url={item.affiliateUrl} commCents={item.commissionPerSaleCents} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── My Network tab ────────────────────────────────────────────────────────────
interface NetworkProduct {
  productId: string
  productTitle: string
  productSlug: string | null
  coverImage: string | null
  affiliateCount: number
  affiliateEnabled: boolean
  commissionPercent: number
  clicks: number
  sales: number
  revenueCents: number
  commissionsCents: number
}

interface AffiliateItem {
  relationshipId: string
  affiliateName: string
  affiliateAvatar: string | null
  productTitle: string
  clicks: number
  sales: number
  revenueGeneratedCents: number
  commissionEarnedCents: number
  joinedAt: string
}

function NetworkTab() {
  const [products, setProducts] = useState<NetworkProduct[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/affiliates/network')
      .then(r => r.json())
      .then(d => {
        setProducts(d.products ?? [])
        setAffiliates(d.affiliates ?? [])
        setTotal(d.totalAffiliates ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>

  const totalRevenue = products.reduce((s, p) => s + p.revenueCents, 0)
  const totalComm = products.reduce((s, p) => s + p.commissionsCents, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white py-20 text-center">
        <Users size={40} className="mb-4 text-neutral-300" />
        <h3 className="text-lg font-semibold text-neutral-800">You don&apos;t have an affiliate network yet.</h3>
        <p className="mt-2 text-sm text-neutral-500 max-w-xs">
          Turn on Sellbop Share for one of your products and let customers promote it for you.
        </p>
        <Link
          href="/dashboard/products"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          View Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Affiliates', value: total.toString() },
          { label: 'Affiliate Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Commissions Owed', value: formatCurrency(totalComm) },
          { label: 'Products Listed', value: products.filter(p => p.affiliateEnabled).length.toString() },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-lg font-bold text-black">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-product breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Product Performance</h3>
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.productId} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-neutral-900 truncate">{p.productTitle}</p>
                  {p.affiliateEnabled
                    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Share ON · {p.commissionPercent}%</span>
                    : <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">Share OFF</span>
                  }
                </div>
                <div className="mt-1 flex gap-4 text-xs text-neutral-500">
                  <span>{p.affiliateCount} affiliate{p.affiliateCount !== 1 ? 's' : ''}</span>
                  <span>{p.clicks} clicks</span>
                  <span>{p.sales} sales</span>
                  <span className="font-semibold text-black">{formatCurrency(p.revenueCents)} generated</span>
                </div>
              </div>
              {p.productSlug && (
                <Link href={`/dashboard/products/${p.productId}`} className="text-xs font-medium text-neutral-400 hover:text-black transition-colors flex-shrink-0">
                  Edit
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate leaderboard */}
      {affiliates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Top Affiliates</h3>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {['Affiliate', 'Product', 'Clicks', 'Sales', 'Revenue', 'Commission'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.map(a => (
                  <tr key={a.relationshipId} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.affiliateAvatar ? (
                          <img src={a.affiliateAvatar} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-500 flex-shrink-0">
                            {a.affiliateName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[120px] font-medium text-neutral-800">{a.affiliateName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 max-w-[140px] truncate">{a.productTitle}</td>
                    <td className="px-4 py-3 text-neutral-700">{a.clicks}</td>
                    <td className="px-4 py-3 text-neutral-700">{a.sales}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{formatCurrency(a.revenueGeneratedCents)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(a.commissionEarnedCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AffiliatesPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('promoting')

  if (!session) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Affiliates</h1>
        <p className="mt-1 text-sm text-neutral-500">Promote products and earn commissions. Let others sell yours.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 w-fit">
        {([['promoting', 'Promoting'], ['network', 'My Network']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'promoting' ? <PromotingTab /> : <NetworkTab />}
    </div>
  )
}
