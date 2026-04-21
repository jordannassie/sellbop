'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import {
  Shirt, RefreshCw, Zap, CheckCircle2, AlertCircle,
  ExternalLink, Info, Link2, Link2Off, ChevronDown, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/domain/entities'

// ── Types ─────────────────────────────────────────────────────
interface PrintifyShop { id: number; title: string; sales_channel: string }
type ConnectStatus = 'loading' | 'disconnected' | 'connecting' | 'connected' | 'error'

interface StatusResult {
  connected: boolean
  source: 'session' | 'env' | 'demo'
  shopId: string | null
}

// ── Connection status badge ───────────────────────────────────
function SourceBadge({ source }: { source: StatusResult['source'] }) {
  if (source === 'session') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 size={11} /> Connected
      </span>
    )
  }
  if (source === 'env') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <CheckCircle2 size={11} /> Via env var
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Info size={11} /> Demo mode
    </span>
  )
}

// ── Product card ──────────────────────────────────────────────
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
          {p.variants && p.variants.length > 0 && ` · ${p.variants.length} sizes`}
          {p.printifyProductId && (
            <span className="text-neutral-300 ml-1">· {p.printifyProductId}</span>
          )}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">Fulfilled via Printify</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {p.status === 'published' && (
          <Link href={`/p/${p.slug}`} target="_blank">
            <Button size="sm" variant="ghost"><ExternalLink size={13} />View</Button>
          </Link>
        )}
        <span className="text-xs text-neutral-400 whitespace-nowrap hidden sm:block">Managed in Printify</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function PrintifyPage() {
  // Connection state
  const [connectStatus, setConnectStatus]   = useState<ConnectStatus>('loading')
  const [statusData, setStatusData]         = useState<StatusResult | null>(null)
  const [shops, setShops]                   = useState<PrintifyShop[]>([])
  const [connectError, setConnectError]     = useState('')

  // Form
  const [token, setToken]                   = useState('')
  const [shopIdInput, setShopIdInput]       = useState('')
  const [showToken, setShowToken]           = useState(false)
  const [selectedShopId, setSelectedShopId] = useState('')

  // Sync
  const [syncing, setSyncing]               = useState(false)
  const [syncMsg, setSyncMsg]               = useState('')
  const [syncError, setSyncError]           = useState('')

  // Products
  const [clothingProducts, setClothingProducts] = useState<Product[]>([])

  const tokenRef = useRef<HTMLInputElement>(null)

  // ── Load status + saved products on mount ─────────────────
  useEffect(() => {
    fetch('/api/printify/status')
      .then(r => r.json())
      .then((d: StatusResult) => {
        setStatusData(d)
        setConnectStatus(d.connected ? 'connected' : 'disconnected')
        if (d.shopId) setSelectedShopId(d.shopId)
      })
      .catch(() => setConnectStatus('disconnected'))

    demoProductRepo.findAll(DEMO_SELLER_PROFILE.id).then(all => {
      setClothingProducts(all.filter(p => p.source === 'printify'))
    })
  }, [])

  // ── Connect ───────────────────────────────────────────────
  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) { tokenRef.current?.focus(); return }
    setConnectStatus('connecting')
    setConnectError('')

    try {
      const res = await fetch('/api/printify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), shopId: shopIdInput.trim() || undefined }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setConnectError(data.error ?? 'Connection failed.')
        setConnectStatus('error')
        return
      }

      // Clear token from state immediately — it's now in the httpOnly cookie
      setToken('')
      setShopIdInput('')
      setShops(data.shops ?? [])
      if (data.shopId) setSelectedShopId(data.shopId)

      setStatusData({ connected: true, source: 'session', shopId: data.shopId })
      setConnectStatus('connected')

      // Re-check status (to confirm cookie was set)
      fetch('/api/printify/status').then(r => r.json()).then(setStatusData)
    } catch {
      setConnectError('Network error. Check your connection and try again.')
      setConnectStatus('error')
    }
  }

  // ── Select shop ───────────────────────────────────────────
  async function handleSelectShop(shopId: string) {
    setSelectedShopId(shopId)
    await fetch('/api/printify/select-shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId }),
    })
    setStatusData(prev => prev ? { ...prev, shopId } : prev)
  }

  // ── Disconnect ────────────────────────────────────────────
  async function handleDisconnect() {
    await fetch('/api/printify/disconnect', { method: 'POST' })
    setConnectStatus('disconnected')
    setStatusData({ connected: false, source: 'demo', shopId: null })
    setShops([])
    setSelectedShopId('')
    setSyncMsg('')
    setSyncError('')
  }

  // ── Sync ──────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    setSyncError('')
    try {
      const shopId = selectedShopId || statusData?.shopId || undefined
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
      setClothingProducts(updated.filter(p => p.source === 'printify'))
      setSyncMsg(`${data.count} product${data.count !== 1 ? 's' : ''} synced${data.demo ? ' (demo)' : ' from Printify'}.`)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const isConnected  = connectStatus === 'connected'
  const isConnecting = connectStatus === 'connecting'
  const showShopPicker = isConnected && shops.length > 1 && !selectedShopId
  const activeShop  = shops.find(s => String(s.id) === selectedShopId)

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Shirt size={22} /> Clothing
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Connect Printify to sync print-on-demand clothing products.
          </p>
        </div>
        {connectStatus !== 'loading' && statusData && (
          <SourceBadge source={statusData.source} />
        )}
      </div>

      {/* ── CONNECT CARD ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isConnected ? <Link2 size={15} /> : <Link2Off size={15} />}
            {isConnected ? 'Printify Connected' : 'Connect Printify'}
          </CardTitle>
        </CardHeader>
        <CardContent>

          {/* Loading */}
          {connectStatus === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
              <RefreshCw size={14} className="animate-spin" /> Checking connection…
            </div>
          )}

          {/* Connected state */}
          {isConnected && statusData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={15} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-800">
                    {statusData.source === 'env'
                      ? 'Connected via environment variable'
                      : 'Connected · Token saved for this session'}
                  </p>
                </div>
                {statusData.shopId && (
                  <p className="text-xs text-green-700">
                    Shop ID: <span className="font-mono font-semibold">{statusData.shopId}</span>
                    {activeShop && <span className="ml-1">({activeShop.title})</span>}
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1">Token is stored securely in an httpOnly cookie — not visible in browser.</p>
              </div>

              {/* Shop selector — shown after connect if multiple shops returned */}
              {shops.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    {selectedShopId ? 'Active shop' : 'Select a shop'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedShopId}
                        onChange={e => handleSelectShop(e.target.value)}
                        className="w-full appearance-none border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black pr-8 bg-white"
                      >
                        <option value="">— Choose a shop —</option>
                        {shops.map(s => (
                          <option key={s.id} value={String(s.id)}>
                            {s.title} (ID: {s.id})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Single shop auto-selected — just show it */}
              {shops.length === 1 && (
                <p className="text-xs text-neutral-500">
                  Shop: <span className="font-medium text-neutral-700">{shops[0].title}</span>
                  <span className="text-neutral-400 ml-1">(auto-selected)</span>
                </p>
              )}

              {statusData.source === 'session' && (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600 transition-colors"
                >
                  <Link2Off size={13} /> Disconnect
                </button>
              )}
            </div>
          )}

          {/* Disconnected / error — show form */}
          {(connectStatus === 'disconnected' || connectStatus === 'error') && (
            <form onSubmit={handleConnect} className="space-y-4">
              <p className="text-sm text-neutral-600">
                Paste your Printify Personal Access Token to sync real clothing products into SellBop.
                No Netlify environment changes needed.
              </p>

              <div className="space-y-3">
                {/* Token field */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    Printify API Token <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={tokenRef}
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="pat_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black pr-10 font-mono"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                      tabIndex={-1}
                      aria-label={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Find it in Printify → My Profile → Connections → Personal access tokens
                  </p>
                </div>

                {/* Optional shop ID */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    Shop ID <span className="text-neutral-400 font-normal">(optional — auto-detected if you have one shop)</span>
                  </label>
                  <input
                    type="text"
                    value={shopIdInput}
                    onChange={e => setShopIdInput(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              {connectError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {connectError}
                </div>
              )}

              <Button type="submit" disabled={isConnecting || !token.trim()}>
                {isConnecting ? (
                  <><RefreshCw size={13} className="animate-spin" /> Connecting…</>
                ) : (
                  <><Link2 size={13} /> Connect to Printify</>
                )}
              </Button>
            </form>
          )}

          {/* Connecting spinner overlay */}
          {isConnecting && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <RefreshCw size={13} className="animate-spin" />
              Validating token with Printify…
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── SHOP PICKER (if needed post-connect) ─────────────── */}
      {showShopPicker && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-amber-800 mb-3">
              Multiple shops found — choose one to sync from:
            </p>
            <div className="space-y-2">
              {shops.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectShop(String(s.id))}
                  className="w-full text-left px-4 py-3 rounded-xl border border-amber-200 bg-white text-sm hover:border-amber-400 transition-colors"
                >
                  <span className="font-semibold text-black">{s.title}</span>
                  <span className="text-neutral-400 ml-2 text-xs">ID: {s.id}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SYNC CARD ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sync Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600">
            {statusData?.source === 'demo'
              ? 'No token connected — demo products will be used.'
              : 'Pull the latest products from your Printify shop into SellBop.'}
          </p>

          {isConnected && !selectedShopId && shops.length > 1 && (
            <p className="text-xs text-amber-600">Please select a shop above before syncing.</p>
          )}

          <Button
            onClick={handleSync}
            disabled={syncing || (isConnected && !selectedShopId && shops.length > 1)}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync from Printify'}
          </Button>

          {syncMsg && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <CheckCircle2 size={14} /> {syncMsg}
            </div>
          )}
          {syncError && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {syncError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SYNCED PRODUCTS ───────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Clothing Products ({clothingProducts.length})</CardTitle>
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

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">How it works</p>
        <ul className="text-xs text-neutral-500 space-y-1.5">
          <li>• <span className="font-medium text-neutral-700">Token</span> is stored in an httpOnly cookie — not readable by browser JavaScript</li>
          <li>• <span className="font-medium text-neutral-700">Session</span> lasts 24 hours — reconnect to extend</li>
          <li>• <span className="font-medium text-neutral-700">SellBop</span> handles storefront, checkout, and payments</li>
          <li>• <span className="font-medium text-neutral-700">Printify</span> handles production, fulfillment, and shipping</li>
          <li>• When a clothing product sells, the order is forwarded to Printify automatically</li>
        </ul>
      </div>

    </div>
  )
}
