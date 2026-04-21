'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shirt, RefreshCw, Zap, CheckCircle2, AlertCircle, ExternalLink, Info } from 'lucide-react'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import type { Product } from '@/lib/domain/entities'

interface PrintifyShop {
  id: number
  title: string
  sales_channel: string
}

interface SyncResult {
  products: Product[]
  count: number
  shopId: string
  demo: boolean
}

function PrintifyBadge({ demo }: { demo?: boolean }) {
  if (demo) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Info size={11} /> Demo mode — no API token
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 size={11} /> Connected
    </span>
  )
}

function ClothingProductCard({ p }: { p: Product }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-50 last:border-0">
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 relative">
        {p.thumbnailUrl ? (
          <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <GradientImageFallback productType="bundle" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-black truncate">{p.name}</p>
          <Badge variant={p.status === 'published' ? 'success' : 'warning'}>
            {p.status === 'published' ? 'Live' : p.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
            <Zap size={9} /> Printify
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          {formatCurrency(p.price, p.currency)}
          {p.variants && p.variants.length > 0 && ` · ${p.variants.length} variants`}
          {p.printifyProductId && ` · ID: ${p.printifyProductId}`}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">Fulfilled via Printify</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {p.status === 'published' && (
          <Link href={`/p/${p.slug}`} target="_blank">
            <Button size="sm" variant="ghost"><ExternalLink size={13} />View</Button>
          </Link>
        )}
        <span className="text-xs text-neutral-400 whitespace-nowrap">Managed in Printify</span>
      </div>
    </div>
  )
}

export default function PrintifyPage() {
  const [shops, setShops] = useState<PrintifyShop[]>([])
  const [isDemo, setIsDemo] = useState(true)
  const [shopsLoaded, setShopsLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState('')
  const [clothingProducts, setClothingProducts] = useState<Product[]>([])

  useEffect(() => {
    // Load shops status
    fetch('/api/printify/shops')
      .then(r => r.json())
      .then(d => {
        setShops(d.shops ?? [])
        setIsDemo(d.demo ?? true)
        setShopsLoaded(true)
      })
      .catch(() => setShopsLoaded(true))

    // Load already-synced clothing products
    demoProductRepo.findAll(DEMO_SELLER_PROFILE.id).then(all => {
      setClothingProducts(all.filter(p => p.source === 'printify'))
    })
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncError('')
    setSyncResult(null)
    try {
      const shopId = shops[0]?.id ? String(shops[0].id) : undefined
      const res = await fetch('/api/printify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const existing = await demoProductRepo.findAll(DEMO_SELLER_PROFILE.id)
      const existingByPrintifyId = new Map(
        existing.filter(p => p.source === 'printify').map(p => [p.printifyProductId, p.id]),
      )

      for (const p of data.products as Product[]) {
        const existingId = existingByPrintifyId.get(p.printifyProductId ?? '')
        await demoProductRepo.upsert(existingId ? { ...p, id: existingId } : p)
      }

      const updated = await demoProductRepo.findAll(DEMO_SELLER_PROFILE.id)
      const updatedClothing = updated.filter(p => p.source === 'printify')
      setClothingProducts(updatedClothing)
      setSyncResult(data as SyncResult)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Shirt size={22} /> Printify Clothing
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Sync print-on-demand products from your Printify account.
          </p>
        </div>
        {shopsLoaded && <PrintifyBadge demo={isDemo} />}
      </div>

      {/* Connection status card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!shopsLoaded ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <RefreshCw size={14} className="animate-spin" /> Checking connection…
            </div>
          ) : isDemo ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Running in demo mode</p>
              <p className="text-sm text-amber-700 mb-3">
                No <code className="font-mono bg-amber-100 px-1 rounded">PRINTIFY_API_TOKEN</code> is configured.
                Mock clothing products will be used so you can test the full flow.
              </p>
              <p className="text-xs text-amber-600">
                To connect your real Printify account, add <code className="font-mono">PRINTIFY_API_TOKEN</code> and
                optionally <code className="font-mono">PRINTIFY_SHOP_ID</code> as environment variables on Netlify.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Printify Connected
              </p>
              <p className="text-sm text-green-700">
                {shops.length} shop{shops.length !== 1 ? 's' : ''} found:{' '}
                {shops.map(s => s.title).join(', ')}
              </p>
            </div>
          )}

          {shops.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">Active shop</p>
              <p className="text-sm font-medium text-black">
                {shops[0].title}{' '}
                <span className="text-neutral-400 font-normal text-xs">ID: {shops[0].id}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Sync Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600">
            Pull the latest products from your Printify shop into SellBop.
            Products will appear in your store&apos;s Clothing section.
          </p>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing from Printify…' : 'Sync from Printify'}
          </Button>

          {syncResult && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <CheckCircle2 size={14} />
              {syncResult.count} product{syncResult.count !== 1 ? 's' : ''} synced
              {syncResult.demo ? ' (demo)' : ' from Printify'}.
            </div>
          )}
          {syncError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {syncError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synced products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Clothing Products ({clothingProducts.length})
          </CardTitle>
          <Link href="/dashboard/products">
            <Button size="sm" variant="ghost">View All Products</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {clothingProducts.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Shirt size={32} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-sm text-neutral-500 mb-1">No clothing products yet</p>
              <p className="text-xs text-neutral-400">Sync from Printify above to import your first products.</p>
            </div>
          ) : (
            <div>
              {clothingProducts.map(p => <ClothingProductCard key={p.id} p={p} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Architecture note */}
      <div className="mt-6 bg-neutral-50 border border-neutral-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">How it works</p>
        <ul className="text-xs text-neutral-500 space-y-1.5">
          <li>• <span className="font-medium text-neutral-700">SellBop</span> handles storefront, checkout, and payments</li>
          <li>• <span className="font-medium text-neutral-700">Printify</span> handles production, fulfillment, and shipping</li>
          <li>• When a clothing product sells, the order is forwarded to Printify automatically</li>
          <li>• Shipping and tracking are managed inside your Printify dashboard</li>
        </ul>
      </div>
    </div>
  )
}
