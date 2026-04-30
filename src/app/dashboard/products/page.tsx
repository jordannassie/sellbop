'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Package, ExternalLink, Pencil, Shirt, RefreshCw, Sparkles, Zap } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { StoreIdentityCard } from '@/components/dashboard/store-identity-card'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/domain/entities'

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital Download', service_offer: 'Service Offer',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

function statusVariant(status: string) {
  return status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'warning'
}

type Tab = 'all' | 'clothing'

function ProductRow({ p }: { p: Product }) {
  const isClothing = p.source === 'printify'
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-neutral-100">
        <ProductImage src={p.thumbnailUrl} alt={p.name} productType={p.productType} fill iconSize="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-black truncate">{p.name}</p>
          <Badge variant={statusVariant(p.status)}>
            {p.status === 'published' ? 'Live' : p.status}
          </Badge>
          {isClothing && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
              <Zap size={9} /> Printify
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {isClothing ? 'Clothing · Printify' : TYPE_LABELS[p.productType]}
          {' · '}{formatCurrency(p.price, p.currency)} · {p.salesCount} sales
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {p.status === 'published' && (
          <Link href={`/p/${p.slug}`} target="_blank">
            <Button size="sm" variant="ghost"><ExternalLink size={13} />View</Button>
          </Link>
        )}
        {!isClothing && (
          <Link href={`/dashboard/products/${p.id}`}>
            <Button size="sm" variant="secondary"><Pencil size={13} />Edit</Button>
          </Link>
        )}
        {isClothing && (
          <span className="text-xs text-neutral-400 px-2">Managed in Printify</span>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    demoProductRepo.findAll(DEMO_SELLER_PROFILE.id).then(setProducts)
  }, [])

  const digital = products.filter(p => !p.source)
  const clothing = products.filter(p => p.source === 'printify')
  const displayed = tab === 'clothing' ? clothing : tab === 'all' ? products : digital

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const shopId = clothing[0]?.printifyShopId ?? undefined
      const res = await fetch('/api/printify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Merge synced products into localStorage (upsert by Printify product ID)
      const existing = await demoProductRepo.findAll(DEMO_SELLER_PROFILE.id)
      const existingByPrintifyId = new Map(
        existing.filter(p => p.source === 'printify').map(p => [p.printifyProductId, p.id]),
      )

      for (const p of data.products as Product[]) {
        const existingId = existingByPrintifyId.get(p.printifyProductId ?? '')
        await demoProductRepo.upsert(existingId ? { ...p, id: existingId } : p)
      }

      const updated = await demoProductRepo.findAll(DEMO_SELLER_PROFILE.id)
      setProducts(updated)
      setSyncMsg(`Synced ${data.count} products${data.demo ? ' (demo)' : ''}.`)
    } catch (err) {
      setSyncMsg('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {products.length} products · {products.filter(p => p.status === 'published').length} live
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/printify">
            <Button variant="secondary" size="sm"><Shirt size={14} />Clothing</Button>
          </Link>
          <Link href="/dashboard/products/ai-builder">
            <Button variant="secondary" size="sm"><Sparkles size={14} />Create with AI</Button>
          </Link>
          <Link href="/dashboard/products/new"><Button>+ New Product</Button></Link>
        </div>
      </div>

      <StoreIdentityCard className="mb-8" showEditorLink={false} />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-neutral-100 pb-0">
        {(['all', 'clothing'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black',
            )}
          >
            {t === 'all' && `All (${products.length})`}
            {t === 'clothing' && (
              <span className="flex items-center gap-1.5">
                <Shirt size={13} /> Clothing ({clothing.length})
              </span>
            )}
          </button>
        ))}

        {tab === 'clothing' && (
          <div className="ml-auto flex items-center gap-2 pb-1">
            {syncMsg && (
              <span className="text-xs text-neutral-500">{syncMsg}</span>
            )}
            <Button size="sm" variant="secondary" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync from Printify'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {displayed.length === 0 ? (
            tab === 'clothing' ? (
              <EmptyState
                icon={<Shirt size={32} />}
                title="No clothing products yet"
                description="Sync products from your Printify account to see them here."
                action={
                  <Button size="sm" onClick={handleSync} disabled={syncing}>
                    <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing…' : 'Sync from Printify'}
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={<Package size={32} />} title="No products yet" description="Create your first product page." action={<Link href="/dashboard/products/new"><Button size="sm">Create Product</Button></Link>} />
            )
          ) : (
            <div className="divide-y divide-neutral-50">
              {displayed.map(p => <ProductRow key={p.id} p={p} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
