'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
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
}

function DownloadButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/download?productId=${productId}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Download unavailable.')
        return
      }
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      setError('Download failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        Download
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div
              key={item.purchaseId}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Cover image */}
              <div className="relative h-44 bg-neutral-100">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen size={40} className="text-neutral-300" />
                  </div>
                )}
              </div>

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
                  <DownloadButton productId={item.productId} />
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
