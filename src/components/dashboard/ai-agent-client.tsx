'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Sparkles, Copy, ExternalLink, ChevronDown, Shield, Store,
  Package, DollarSign, TrendingUp, Upload, BarChart3, Handshake,
  CheckCircle2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getClaudeConnectionState } from '@/lib/agent/connection-status'
import { SCOPE_LABELS, accessModeLabel } from '@/lib/agent/scope-labels'
import { cn } from '@/lib/utils'

type AccessMode = 'single_shop' | 'all_managed_shops'

interface HubData {
  mcpUrl: string
  recommendedScopes: string[]
  connections: Array<{
    id: string
    provider: string
    name: string
    scopes: string[]
    access_mode?: string
    store_id?: string | null
    created_at: string
    last_used_at: string | null
    revoked_at: string | null
  }>
  activeConnection: HubData['connections'][0] | null
  shops: Array<{ id: string; name: string; slug: string; role: string; isActive: boolean }>
  activeShop: { id: string; name: string; slug: string } | null
  stripeStatus: {
    connected: boolean
    chargesEnabled: boolean
    payoutsEnabled: boolean
    onboardingComplete: boolean
  } | null
  activity: Array<{
    id: string
    actionLabel: string
    storeName: string | null
    targetType: string | null
    status: string
    createdAt: string
  }>
}

const EXAMPLE_PROMPTS = [
  {
    title: 'Build My Business',
    text: 'Build a complete digital-product business for women ages 30–45 interested in sustainable weight loss. Create 10 complementary products, build a pricing ladder, configure affiliates, arrange the catalog and keep everything in Draft.',
  },
  {
    title: 'Build for an Influencer',
    text: 'This Shop is for an influencer. I will provide her brand, content and audience information. Analyze the opportunity and build products her audience would genuinely value.',
  },
  {
    title: 'Improve My Shop',
    text: 'Review my entire SellBop Shop and sales data. Tell me what is working, what is weak and what products or pricing changes you recommend.',
  },
  {
    title: 'Add Products',
    text: 'Create three new products that complement my current flagship product without duplicating what I already sell.',
  },
]

const CAPABILITIES = [
  { icon: Store, title: 'Build My Shop', text: 'Branding, shop copy, storefront setup and catalog organization.' },
  { icon: Package, title: 'Create Products', text: 'Create new products, descriptions and product listings.' },
  { icon: Sparkles, title: 'Build Complete Catalogs', text: 'Build multiple complementary products around one brand or audience.' },
  { icon: DollarSign, title: 'Pricing', text: 'Create pricing ladders and sales using supported SellBop features.' },
  { icon: TrendingUp, title: 'Affiliates', text: 'Enable affiliate selling and configure commission percentages.' },
  { icon: Upload, title: 'Product Assets', text: 'Upload and attach images and downloadable files. Generated assets work when providers are configured.' },
  { icon: BarChart3, title: 'Analyze My Business', text: 'Read safe shop and product sales analytics to identify opportunities.' },
  { icon: Handshake, title: 'Partner Shops', text: 'Authorized SellBop admins can create and manage Partner Shops through Claude E-Com.' },
]

export function AiAgentClient() {
  const [hub, setHub] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessMode, setAccessMode] = useState<AccessMode>('single_shop')
  const [connecting, setConnecting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConnectPanel, setShowConnectPanel] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agent-connections/hub', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load AI Agent hub.')
      setHub(data)
      if (data.activeConnection?.access_mode === 'all_managed_shops') {
        setAccessMode('all_managed_shops')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI Agent hub.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeConnections = (hub?.connections ?? []).filter(c => !c.revoked_at)
  const connectionState = getClaudeConnectionState(activeConnections)
  const isConnected = connectionState === 'connected' || connectionState === 'mcp_ready'
  const primary = hub?.activeConnection

  async function handleConnect() {
    setConnecting(true)
    try {
      await fetch('/api/agent-connections/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_mode: accessMode }),
      })
      window.open('https://claude.ai/settings/connectors', '_blank', 'noopener,noreferrer')
      toast.success('Open Claude → Add Connector → paste the SellBop MCP URL when prompted.')
      setShowConnectPanel(false)
      load()
    } catch {
      toast.error('Could not prepare connection.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm('Disconnect Claude from SellBop? Claude will lose access immediately. Your activity history will be kept.')) return
    const res = await fetch(`/api/agent-connections/${id}/revoke`, { method: 'POST' })
    if (!res.ok) {
      toast.error('Could not disconnect.')
      return
    }
    toast.success('Claude disconnected.')
    load()
  }

  function copyMcpUrl() {
    if (!hub?.mcpUrl) return
    navigator.clipboard.writeText(hub.mcpUrl)
    toast.success('MCP URL copied.')
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Prompt copied.')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 max-w-lg">
        <p className="font-semibold text-red-800">Unable to load Claude E-Com</p>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        {error.includes('access_mode') && (
          <p className="text-xs text-red-700 mt-3">
            Migration 032 must be applied to production. Run <code className="font-mono">npm run db:apply-032</code> or paste{' '}
            <code className="font-mono">supabase/migrations/032_agent_shop_access.sql</code> in the Supabase SQL Editor.
          </p>
        )}
        <Button size="sm" variant="secondary" className="mt-4" onClick={load}>Retry</Button>
      </div>
    )
  }

  if (!hub) return null

  const shopLabel = accessMode === 'single_shop'
    ? hub.activeShop?.name ?? 'Current Shop'
    : `All ${hub.shops.length} authorized shop${hub.shops.length === 1 ? '' : 's'}`

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Claude E-Com</h1>
        <p className="text-sm font-medium text-neutral-700 mt-2">Your AI agent for building and running your SellBop business.</p>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Connect Claude to your SellBop Shops and let it create products, build catalogs, configure pricing and affiliates,
          analyze your business, and help operate your storefront.
        </p>
      </div>

      {/* Connection status */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {isConnected && primary ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-black">Claude Connected ✓</h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
              <div><dt className="text-neutral-400">Connection</dt><dd className="font-medium">{primary.name}</dd></div>
              <div><dt className="text-neutral-400">Status</dt><dd className="font-medium capitalize">{connectionState === 'connected' ? 'Active' : 'Ready'}</dd></div>
              <div><dt className="text-neutral-400">Access</dt><dd className="font-medium">{accessModeLabel(primary.access_mode)}</dd></div>
              <div><dt className="text-neutral-400">Authorized</dt><dd className="font-medium">{shopLabel}</dd></div>
              <div><dt className="text-neutral-400">Connected</dt><dd>{new Date(primary.created_at).toLocaleDateString()}</dd></div>
              <div><dt className="text-neutral-400">Last activity</dt><dd>{primary.last_used_at ? new Date(primary.last_used_at).toLocaleString() : 'Not yet used'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="font-semibold">Open Claude</Button>
              </a>
              <Button size="sm" variant="secondary" onClick={() => setShowConnectPanel(true)}>Manage Access</Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDisconnect(primary.id)}>Disconnect</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-black mb-1">Connect Claude</h2>
            <p className="text-sm text-neutral-500 mb-5">Give Claude secure access to your SellBop business.</p>

            {/* Shop access picker */}
            <div className="space-y-3 mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Shop access</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccessMode('single_shop')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    accessMode === 'single_shop' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300',
                  )}
                >
                  <p className="text-sm font-semibold text-black">Current Shop Only</p>
                  <p className="text-xs text-neutral-500 mt-1">{hub.activeShop?.name ?? 'Your active shop'}</p>
                  <p className="text-xs text-neutral-400 mt-2">Claude can only manage this Shop.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccessMode('all_managed_shops')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    accessMode === 'all_managed_shops' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300',
                  )}
                >
                  <p className="text-sm font-semibold text-black">All My Shops</p>
                  <p className="text-xs text-neutral-500 mt-1">{hub.shops.length} shop{hub.shops.length === 1 ? '' : 's'}</p>
                  <p className="text-xs text-neutral-400 mt-2">Every Shop you already manage.</p>
                </button>
              </div>
              <p className="text-xs text-neutral-500">Claude can never access Shops you do not already have permission to manage.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConnect} loading={connecting} className="font-semibold text-white" style={{ background: '#00E676', borderColor: '#00E676' }}>
                Connect Claude
              </Button>
              <a href="https://claude.com/download" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary"><ExternalLink size={14} /> Download Claude Desktop</Button>
              </a>
            </div>
            <button type="button" className="text-xs text-neutral-500 underline mt-3" onClick={() => setShowConnectPanel(true)}>
              Already use Claude? Connect now
            </button>
          </>
        )}

        {showConnectPanel && (
          <div className="mt-5 pt-5 border-t border-neutral-100 space-y-3">
            <p className="text-sm font-medium">Add SellBop in Claude</p>
            <ol className="text-sm text-neutral-600 list-decimal list-inside space-y-1">
              <li>Open Claude → Settings → Connectors → Add custom connector</li>
              <li>Paste the SellBop MCP URL below</li>
              <li>Sign in to SellBop when Claude asks and approve access</li>
            </ol>
            <div className="flex gap-2">
              <code className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">{hub.mcpUrl}</code>
              <Button size="sm" variant="secondary" onClick={copyMcpUrl}><Copy size={14} /></Button>
            </div>
            <a href="https://claude.ai/settings/connectors" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary"><ExternalLink size={13} /> Open Claude Connectors</Button>
            </a>
          </div>
        )}
      </section>

      {/* Stripe */}
      {hub.stripeStatus && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-black mb-2">Stripe Payments</h3>
          {hub.stripeStatus.connected && hub.stripeStatus.chargesEnabled ? (
            <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} /> Connected — ready to accept payments</p>
          ) : (
            <>
              <p className="text-sm text-neutral-600">Not connected — connect Stripe so your Shop can accept payments.</p>
              <Link href="/dashboard/payouts" className="inline-block mt-2">
                <Button size="sm" variant="secondary">Connect Stripe</Button>
              </Link>
            </>
          )}
          <p className="text-xs text-neutral-400 mt-2">Bank and identity verification always happens through Stripe&apos;s secure hosted flow — never through Claude.</p>
        </section>
      )}

      {/* Get Claude */}
      <section>
        <h2 className="text-lg font-bold text-black mb-3">Get Claude</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Claude E-Com works with Claude&apos;s remote MCP connector. Install Claude on your computer or use a supported Claude interface, then connect SellBop.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="https://claude.com/download" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary"><ExternalLink size={14} /> Download for Mac / Windows</Button>
          </a>
          <Button variant="ghost" onClick={() => setShowConnectPanel(true)}>I already have Claude</Button>
        </div>
      </section>

      {/* 3 steps */}
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h2 className="text-lg font-bold text-black mb-4">Connect Claude in 3 Steps</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Get Claude', body: 'Install or open Claude.', action: 'Get Claude', href: 'https://claude.com/download' },
            { step: '2', title: 'Connect SellBop', body: 'Click Connect Claude, choose Current Shop Only or All My Shops. SellBop handles secure configuration.', action: 'Connect Claude', onClick: handleConnect },
            { step: '3', title: 'Start Building', body: 'Open Claude and tell it what you want — products, catalogs, pricing, affiliates, and more.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black text-white text-sm font-bold">{s.step}</span>
              <div>
                <p className="font-semibold text-black">{s.title}</p>
                <p className="text-sm text-neutral-600 mt-0.5">{s.body}</p>
                {s.href && (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                    <Button size="xs" variant="secondary">{s.action}</Button>
                  </a>
                )}
                {s.onClick && (
                  <Button size="xs" variant="secondary" className="mt-2" onClick={s.onClick}>{s.action}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section>
        <h2 className="text-lg font-bold text-black mb-4">What Claude Can Do</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {CAPABILITIES.map(c => (
            <div key={c.title} className="rounded-xl border border-neutral-200 bg-white p-4">
              <c.icon size={18} className="text-neutral-700 mb-2" />
              <p className="text-sm font-semibold text-black">{c.title}</p>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example prompts */}
      <section>
        <h2 className="text-lg font-bold text-black mb-4">Try asking Claude</h2>
        <div className="space-y-3">
          {EXAMPLE_PROMPTS.map(p => (
            <div key={p.title} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-black mb-2">{p.title}</p>
              <p className="text-xs text-neutral-600 leading-relaxed italic">&ldquo;{p.text}&rdquo;</p>
              <Button size="xs" variant="secondary" className="mt-3" onClick={() => copyPrompt(p.text)}><Copy size={12} /> Copy Prompt</Button>
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Recent Claude Activity</h2>
          <Link href="/dashboard/settings/ai-integrations" className="text-xs font-semibold text-neutral-500 hover:text-black">View All Activity →</Link>
        </div>
        {hub.activity.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center rounded-xl border border-neutral-200 bg-white">Claude hasn&apos;t made any changes yet.</p>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
            {hub.activity.map(a => (
              <div key={a.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                <div>
                  <p className="font-medium text-neutral-800">{a.actionLabel}</p>
                  <p className="text-xs text-neutral-400">{a.storeName ?? '—'} · {a.targetType ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  {a.status === 'error' && <Badge variant="danger">Failed</Badge>}
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Permissions */}
      <section>
        <h2 className="text-lg font-bold text-black mb-4">Claude Access</h2>
        <ul className="space-y-2">
          {hub.recommendedScopes.map(scope => {
            const info = SCOPE_LABELS[scope]
            if (!info) return null
            return (
              <li key={scope} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><span className="font-medium text-black">{info.label}</span><span className="text-neutral-500"> — {info.description}</span></span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Safety */}
      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <h3 className="text-sm font-semibold text-black flex items-center gap-2"><Shield size={16} /> You stay in control</h3>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Claude can operate the parts of SellBop you authorize. Security, identity, and regulated financial actions may still require you to complete a confirmation step.
          Stripe bank onboarding always happens through Stripe&apos;s secure hosted flow — Claude never receives bank details or secret keys.
        </p>
      </section>

      {/* Advanced */}
      <section>
        <button type="button" onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black">
          Advanced Connection Details <ChevronDown size={16} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
        </button>
        {showAdvanced && primary && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4 text-xs font-mono space-y-2 text-neutral-600">
            <p><span className="text-neutral-400">MCP endpoint:</span> {hub.mcpUrl}</p>
            <p><span className="text-neutral-400">Connection ID:</span> {primary.id}</p>
            <p><span className="text-neutral-400">Access mode:</span> {primary.access_mode ?? 'single_shop'}</p>
            <p><span className="text-neutral-400">Scopes:</span> {primary.scopes.join(', ')}</p>
            <Button size="xs" variant="secondary" onClick={copyMcpUrl}><Copy size={12} /> Copy MCP URL</Button>
          </div>
        )}
      </section>
    </div>
  )
}
