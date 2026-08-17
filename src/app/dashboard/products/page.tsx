'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Package, ExternalLink, Pencil, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { isSupabaseConfigured } from '@/lib/env'

interface ProductRow {
  id: string
  title: string
  slug: string
  price_cents: number | null
  is_live: boolean
  cover_image_url: string | null
  image_url: string | null
  sales_count: number
  created_at: string
  updated_at: string
}

function ProductRow({ p, onDelete, storeSlug }: {
  p: ProductRow
  onDelete: (id: string) => void
  storeSlug: string | null
}) {
  const [deleting, setDeleting] = useState(false)

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

  const coverUrl = p.cover_image_url ?? p.image_url

  return (
    <div className="px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4">
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
          <p className="text-sm font-semibold text-black truncate max-w-[200px] sm:max-w-none">{p.title}</p>
          <Badge variant={p.is_live ? 'success' : 'neutral'}>
            {p.is_live ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 truncate">
          {(p.price_cents ?? 0) === 0 ? 'Free' : formatCurrency((p.price_cents ?? 0) / 100)}
          {' · '}{p.sales_count} sales
          <span className="hidden sm:inline"> · Updated {timeAgo(p.updated_at ?? p.created_at)}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {p.is_live && (
          <Link href={`/p/${p.slug}`} target="_blank" className="hidden sm:block">
            <Button size="sm" variant="ghost"><ExternalLink size={13} />View</Button>
          </Link>
        )}
        <Button size="sm" variant="ghost" onClick={handleCopyLink}>
          <Copy size={13} />
          <span className="hidden sm:inline">Copy Link</span>
        </Button>
        <Link href={`/dashboard/products/${p.id}`}>
          <Button size="sm" variant="secondary"><Pencil size={13} /><span className="hidden sm:inline">Edit</span></Button>
        </Link>
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
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)

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
              {products.map(p => (
                <ProductRow key={p.id} p={p} onDelete={handleDelete} storeSlug={store?.slug ?? null} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
