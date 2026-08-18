'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Toggle } from '@/components/ui/toggle'
import { Package, ExternalLink, Pencil, Copy, Trash2, TrendingUp, Grid3x3, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { isSupabaseConfigured } from '@/lib/env'

interface Product {
  id: string
  title: string
  slug: string
  price_cents: number | null
  is_live: boolean
  sort_order: number
  cover_image_url: string | null
  image_url: string | null
  sales_count: number
  created_at: string
  updated_at: string
  marketplace_listing: boolean | null
  affiliate_enabled: boolean | null
  affiliate_commission_percent: number | null
}

function ProductRow({
  p, onDelete, onTogglePublish, onMove, isFirst, isLast,
}: {
  p: Product
  onDelete: (id: string) => void
  onTogglePublish: (id: string, nextLive: boolean) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  isFirst: boolean
  isLast: boolean
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete.')
      onDelete(p.id)
      toast.success('Product deleted.')
    } catch {
      toast.error('Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/p/${p.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  async function handleTogglePublish(next: boolean) {
    setPublishing(true)
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: next }),
      })
      if (!res.ok) throw new Error()
      onTogglePublish(p.id, next)
      toast.success(next ? 'Product published.' : 'Product moved to draft.')
    } catch {
      toast.error('Failed to update publish status.')
    } finally {
      setPublishing(false)
    }
  }

  const coverUrl = p.cover_image_url ?? p.image_url

  return (
    <div className="px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4">
      {/* Reorder */}
      <div className="hidden sm:flex flex-col shrink-0">
        <button
          type="button"
          onClick={() => onMove(p.id, 'up')}
          disabled={isFirst}
          className="text-neutral-400 hover:text-black disabled:opacity-25 disabled:hover:text-neutral-400"
          aria-label="Move up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMove(p.id, 'down')}
          disabled={isLast}
          className="text-neutral-400 hover:text-black disabled:opacity-25 disabled:hover:text-neutral-400"
          aria-label="Move down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 flex items-center justify-center">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <Package size={18} className="text-neutral-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-black truncate max-w-[160px] sm:max-w-none">{p.title}</p>
          <Badge variant={p.is_live ? 'success' : 'neutral'}>
            {p.is_live ? 'Live' : 'Draft'}
          </Badge>
          {/* Growth feature indicators */}
          {(p.marketplace_listing ?? true) && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-neutral-400">
              <Grid3x3 size={9} /> Marketplace
            </span>
          )}
          {(p.affiliate_enabled ?? true) && (p.price_cents ?? 0) > 0 && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium" style={{ color: '#00A854' }}>
              <TrendingUp size={9} /> {p.affiliate_commission_percent ?? 30}% Affiliate
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate">
          {(p.price_cents ?? 0) === 0 ? 'Free' : formatCurrency(p.price_cents ?? 0)}
          {' · '}{p.sales_count} sales
          <span className="hidden sm:inline"> · Updated {timeAgo(p.updated_at ?? p.created_at)}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <Toggle checked={p.is_live} onChange={handleTogglePublish} disabled={publishing} />
        {p.is_live && (
          <Button
            size="sm"
            variant="ghost"
            className="hidden sm:inline-flex"
            onClick={() => window.open(`/p/${p.slug}`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={13} />View
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={handleCopyLink}>
          <Copy size={13} />
          <span className="hidden sm:inline">Copy Link</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(`/dashboard/products/${p.id}`)}
        >
          <Pencil size={13} /><span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          loading={deleting}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { session } = useAuth()
  const { store } = useUserStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (!session || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    fetch('/api/products')
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [session])

  function handleDelete(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function handleTogglePublish(id: string, nextLive: boolean) {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, is_live: nextLive } : p)))
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = products.findIndex(p => p.id === id)
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || swapWith < 0 || swapWith >= products.length || reordering) return

    const a = products[index]
    const b = products[swapWith]

    // Optimistic UI: swap positions and sort_order values immediately
    const next = [...products]
    next[index] = { ...b, sort_order: a.sort_order }
    next[swapWith] = { ...a, sort_order: b.sort_order }
    setProducts(next)
    setReordering(true)

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/products/${a.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: b.sort_order }),
        }),
        fetch(`/api/products/${b.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: a.sort_order }),
        }),
      ])
      if (!resA.ok || !resB.ok) throw new Error()
    } catch {
      toast.error('Failed to reorder products.')
      setProducts(products) // revert
    } finally {
      setReordering(false)
    }
  }

  const storeUrl = store?.slug ? `/${store.slug}` : null

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} · {products.filter(p => p.is_live).length} live
          </p>
        </div>
        <div className="flex items-center gap-2">
          {storeUrl && (
            <Link href={storeUrl} target="_blank">
              <Button variant="secondary" size="sm"><ExternalLink size={13} />Store</Button>
            </Link>
          )}
          <Link href="/dashboard/products/new">
            <Button size="sm">+ New Product</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-neutral-50">
              {[1,2,3].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded w-48" />
                    <div className="h-3 bg-neutral-100 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Package size={32} />}
              title="You haven't created a product yet"
              description="Upload a digital file, set a price, and share your link to start selling."
              action={
                <Link href="/dashboard/products/new">
                  <Button size="sm">Create Your First Product</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-neutral-50">
              {products.map((p, i) => (
                <ProductRow
                  key={p.id}
                  p={p}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  onMove={handleMove}
                  isFirst={i === 0}
                  isLast={i === products.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {products.length > 1 && (
        <p className="text-xs text-neutral-400 mt-3">
          Use the arrows on the left of each product to reorder how they appear on your storefront.
        </p>
      )}
    </div>
  )
}
