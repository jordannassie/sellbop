'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles, Copy, ExternalLink, ChevronDown, Shield, Store,
  Package, DollarSign, TrendingUp, Upload, BarChart3, Handshake,
  CheckCircle2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getClaudeConnectionState } from '@/lib/agent/connection-status'
import { SCOPE_LABELS, accessModeLabel } from '@/lib/agent/scope-labels'
import { cn } from '@/lib/utils'

const CLAUDE_CONNECTORS_URL = 'https://claude.ai/new?modal=add-custom-connector#settings/customize-connectors'
const CLAUDE_DOWNLOAD_URL = 'https://claude.com/download'
const CONNECTOR_NAME = 'SellBop'
const MCP_URL = 'https://sellbop.com/api/mcp'
const TEST_PROMPT = 'List the SellBop Shops I can manage. Do not make any changes yet.'
const BUILD_TEST_PROMPT = 'In my selected SellBop Shop, create one Draft product called Claude E-Com Test, price it at $9, enable affiliates at 40%, audit the Shop, and return the private preview URL. Do not publish anything.'
const CONNECTOR_SCREENSHOT_URL = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/connector.png'
const ALWAYS_ALLOW_SCREENSHOT_URL = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/always%20allow.png'

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
  boundShop: { id: string; name: string; slug: string } | null
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

function authorizedShopsLabel(
  hub: HubData,
  connectionAccessMode?: string | null,
  connectionStoreId?: string | null,
): string {
  const mode = connectionAccessMode === 'all_managed_shops' ? 'all_managed_shops' : 'single_shop'
  if (mode === 'all_managed_shops') {
    if (hub.shops.length === 0) return 'All authorized shops'
    if (hub.shops.length <= 3) return hub.shops.map(s => s.name).join(', ')
    return `All ${hub.shops.length} authorized shops`
  }
  const bound = hub.boundShop ?? hub.shops.find(s => s.id === connectionStoreId)
  return bound?.name ?? 'Current Shop'
}

function connectionAccessModeOf(connection: HubData['connections'][0] | null | undefined): AccessMode {
  return connection?.access_mode === 'all_managed_shops' ? 'all_managed_shops' : 'single_shop'
}

function ShopAccessPicker({
  hub,
  accessMode,
  onAccessModeChange,
}: {
  hub: HubData
  accessMode: AccessMode
  onAccessModeChange: (mode: AccessMode) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Shop access</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAccessModeChange('single_shop')}
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
          onClick={() => onAccessModeChange('all_managed_shops')}
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
  )
}

function AddSellBopHelper({ mcpUrl, onCopyMcpUrl, onCopyName }: { mcpUrl: string; onCopyMcpUrl: () => void; onCopyName: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
      <h3 className="text-sm font-bold text-black">Add SellBop to Claude</h3>
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name</p>
        <p className="text-sm font-medium text-black mt-1">{CONNECTOR_NAME}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Remote MCP server URL</p>
        <code className="block mt-1 text-sm font-mono text-black break-all">{mcpUrl}</code>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onCopyMcpUrl}>
          <Copy size={14} className="mr-1" /> Copy MCP URL
        </Button>
        <Button size="sm" variant="ghost" onClick={onCopyName}>
          <Copy size={14} className="mr-1" /> Copy Name
        </Button>
      </div>
      <p className="text-xs text-neutral-500">Leave Advanced Settings blank.</p>
    </div>
  )
}

function ClaudeConnectorScreenshot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('mt-4 space-y-3', compact && 'mt-3')}>
      <h4 className={cn('font-semibold text-black', compact ? 'text-sm' : 'text-base')}>
        This is the screen you&apos;ll see in Claude
      </h4>
      <div className="mx-auto w-full max-w-[800px]">
        <Image
          src={CONNECTOR_SCREENSHOT_URL}
          alt="Claude Add custom connector dialog with Name and Remote MCP server URL fields"
          width={528}
          height={558}
          className="w-full h-auto rounded-xl border border-neutral-200 shadow-sm"
          sizes="(max-width: 768px) 100vw, 528px"
        />
      </div>
      <p className={cn('text-neutral-600 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        <span className="font-medium text-black">Enter:</span>
        <br />
        Name: <span className="font-medium text-black">{CONNECTOR_NAME}</span>
        <br />
        Remote MCP server URL: <span className="font-medium text-black break-all">{MCP_URL}</span>
        <br />
        Leave Advanced Settings blank.
        <br />
        Click <span className="font-medium text-black">Add</span>.
      </p>
    </div>
  )
}

function ClaudeAlwaysAllowScreenshot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('mt-4 space-y-3', compact && 'mt-3')}>
      <h4 className={cn('font-semibold text-black', compact ? 'text-sm' : 'text-base')}>
        Let Claude Work Without Constant Approval
      </h4>
      <p className={cn('text-neutral-600 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        Claude may ask you to approve individual SellBop actions.
      </p>
      <p className={cn('text-neutral-600 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        For a smoother Claude E-Com experience, set trusted SellBop tools to:{' '}
        <span className="font-medium text-black">Always Allow</span>
      </p>
      <p className={cn('text-neutral-600 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        This lets Claude build your Shop, create products, update pricing, configure affiliates, generate assets, and complete longer workflows without asking for approval on every single action.
      </p>
      <div className="mx-auto w-full max-w-[800px]">
        <Image
          src={ALWAYS_ALLOW_SCREENSHOT_URL}
          alt="Claude tool permission menu showing Always Allow option for SellBop"
          width={198}
          height={234}
          className="w-full h-auto rounded-xl border border-neutral-200 shadow-sm"
          sizes="(max-width: 768px) 100vw, 198px"
        />
      </div>
      <p className={cn('text-neutral-600 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        <span className="font-medium text-black">Look for &ldquo;Always Allow&rdquo;</span> or the equivalent trusted-tool permission option in Claude.
      </p>
      <p className={cn('text-neutral-500 leading-relaxed', compact ? 'text-xs' : 'text-xs')}>
        Only enable Always Allow for SellBop if you trust the connection and want Claude to operate your authorized Shops.
      </p>
    </div>
  )
}

function ConnectionSteps({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('space-y-5', compact && 'space-y-4 text-sm')}>
      <div>
        <h3 className={cn('font-bold text-black', compact ? 'text-sm' : 'text-base')}>1. Open Claude</h3>
        <p className="text-neutral-600 mt-1">Click <span className="font-medium text-black">Connect Claude</span>.</p>
      </div>
      <div>
        <h3 className={cn('font-bold text-black', compact ? 'text-sm' : 'text-base')}>2. Add SellBop custom connector</h3>
        <ClaudeConnectorScreenshot compact={compact} />
      </div>
      <div>
        <h3 className={cn('font-bold text-black', compact ? 'text-sm' : 'text-base')}>3. Authorize SellBop</h3>
        <p className="text-neutral-600 mt-1 leading-relaxed">
          Claude will connect to SellBop and request authorization if required. After authorization, return to SellBop — you should see{' '}
          <span className="font-medium text-black">Claude Connected ✓</span>.
        </p>
      </div>
      <div>
        <h3 className={cn('font-bold text-black', compact ? 'text-sm' : 'text-base')}>4. Set SellBop to Always Allow for smoother hands-free operation</h3>
        <ClaudeAlwaysAllowScreenshot compact={compact} />
      </div>
      <div>
        <h3 className={cn('font-bold text-black', compact ? 'text-sm' : 'text-base')}>5. Start using Claude E-Com</h3>
        <p className="text-neutral-600 mt-1 leading-relaxed">
          Open a Claude chat, enable <span className="font-medium text-black">SellBop</span> under{' '}
          <span className="font-medium text-black">+ → Connectors</span>, and try one of the test prompts below — or ask Claude to build your Shop.
        </p>
      </div>
    </div>
  )
}

function TestConnectionSection({
  onCopyTestPrompt,
  onCopyBuildTest,
}: {
  onCopyTestPrompt: () => void
  onCopyBuildTest: () => void
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-4">
      <h3 className="text-sm font-bold text-black">Test your connection</h3>
      <p className="text-sm text-neutral-600 leading-relaxed">
        Open a new Claude chat and make sure <span className="font-medium text-black">SellBop</span> is enabled under{' '}
        <span className="font-medium text-black">+ → Connectors</span>.
      </p>
      <div>
        <blockquote className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 italic">
          {TEST_PROMPT}
        </blockquote>
        <Button size="sm" variant="secondary" className="mt-2" onClick={onCopyTestPrompt}>
          <Copy size={14} className="mr-1" /> Copy Test Prompt
        </Button>
      </div>
      <div>
        <blockquote className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 italic">
          {BUILD_TEST_PROMPT}
        </blockquote>
        <Button size="sm" variant="secondary" className="mt-2" onClick={onCopyBuildTest}>
          <Copy size={14} className="mr-1" /> Copy Build Test
        </Button>
      </div>
    </section>
  )
}

export function AiAgentClient() {
  const [hub, setHub] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessMode, setAccessMode] = useState<AccessMode>('single_shop')
  const [connecting, setConnecting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showManageAccess, setShowManageAccess] = useState(false)
  const [showConnectionHelp, setShowConnectionHelp] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agent-connections/hub', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load AI Agent hub.')
      setHub(data)
      if (data.activeConnection) {
        setAccessMode(connectionAccessModeOf(data.activeConnection))
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
  const mcpUrl = hub?.mcpUrl ?? MCP_URL

  async function saveAccessMode() {
    await fetch('/api/agent-connections/hub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_mode: accessMode }),
    })
  }

  async function handleReconnectClaude() {
    setConnecting(true)
    try {
      await saveAccessMode()
      window.open(CLAUDE_CONNECTORS_URL, '_blank', 'noopener,noreferrer')
      toast.success('Reconnect Claude — approve SellBop again to apply your new shop access.')
      load()
    } catch {
      toast.error('Could not prepare reconnection.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleConnectClaude() {
    setConnecting(true)
    try {
      await saveAccessMode()
      window.open(CLAUDE_CONNECTORS_URL, '_blank', 'noopener,noreferrer')
      toast.success('Claude opened — paste SellBop into the Add custom connector form.')
      load()
    } catch {
      toast.error('Could not prepare connection.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleSaveAccessMode() {
    if (!primary) return
    const targetMode = accessMode
    const currentMode = connectionAccessModeOf(primary)
    if (targetMode !== currentMode) {
      await handleReconnectClaude()
      return
    }
    setConnecting(true)
    try {
      await saveAccessMode()
      toast.success('Shop access preference saved.')
      setShowManageAccess(false)
      load()
    } catch {
      toast.error('Could not update shop access.')
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
    navigator.clipboard.writeText(MCP_URL)
    toast.success('MCP URL copied.')
  }

  function copyConnectorName() {
    navigator.clipboard.writeText(CONNECTOR_NAME)
    toast.success('Name copied.')
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Prompt copied.')
  }

  function copyBuildTest() {
    navigator.clipboard.writeText(BUILD_TEST_PROMPT)
    toast.success('Build test copied.')
  }

  function copyTestPrompt() {
    navigator.clipboard.writeText(TEST_PROMPT)
    toast.success('Test prompt copied.')
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
        <Button size="sm" variant="secondary" className="mt-4" onClick={load}>Retry</Button>
      </div>
    )
  }

  if (!hub) return null

  const lastActivity = hub.activity[0]
  const connectionMode = connectionAccessModeOf(primary)
  const connectedShopLabel = authorizedShopsLabel(hub, primary?.access_mode, primary?.store_id)
  const accessModeMismatch = isConnected && !!primary && accessMode !== connectionMode
  const reconnectLabel = accessMode === 'all_managed_shops'
    ? 'Reconnect Claude with All My Shops access'
    : 'Reconnect Claude with Current Shop Only access'

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

      {/* Connection */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {isConnected && primary ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-black">Claude Connected ✓</h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
              <div><dt className="text-neutral-400">Connection</dt><dd className="font-medium">{primary.name}</dd></div>
              <div><dt className="text-neutral-400">Access mode</dt><dd className="font-medium">{accessModeLabel(primary.access_mode)}</dd></div>
              <div><dt className="text-neutral-400">Authorized Shop(s)</dt><dd className="font-medium">{connectedShopLabel}</dd></div>
              <div><dt className="text-neutral-400">Last activity</dt><dd>{primary.last_used_at ? new Date(primary.last_used_at).toLocaleString() : lastActivity ? `${lastActivity.actionLabel} · ${new Date(lastActivity.createdAt).toLocaleString()}` : 'Not yet used'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2 mb-6">
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="font-semibold">Open Claude</Button>
              </a>
              <Button size="sm" variant="secondary" onClick={() => setShowManageAccess(v => !v)}>Manage Access</Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDisconnect(primary.id)}>Disconnect</Button>
            </div>

            {showManageAccess && (
              <div className="mb-6 pt-5 border-t border-neutral-100">
                <ShopAccessPicker hub={hub} accessMode={accessMode} onAccessModeChange={setAccessMode} />
                {accessModeMismatch ? (
                  <>
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
                      Your Claude connection is currently <span className="font-medium">{accessModeLabel(connectionMode)}</span>.
                      Reconnect to apply <span className="font-medium">{accessModeLabel(accessMode)}</span>.
                    </p>
                    <Button size="sm" className="mt-4 font-semibold" loading={connecting} onClick={handleReconnectClaude}>
                      {reconnectLabel} <ExternalLink size={14} className="ml-1" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" className="mt-4" loading={connecting} onClick={handleSaveAccessMode}>
                      Save shop access
                    </Button>
                    <p className="text-xs text-neutral-500 mt-2">Your current Claude connection matches this access mode.</p>
                  </>
                )}
              </div>
            )}

            <TestConnectionSection onCopyTestPrompt={copyTestPrompt} onCopyBuildTest={copyBuildTest} />

            <div className="mt-6 pt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowConnectionHelp(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black"
              >
                Connection Help <ChevronDown size={16} className={cn('transition-transform', showConnectionHelp && 'rotate-180')} />
              </button>
              {showConnectionHelp && (
                <div className="mt-4 space-y-4">
                  <AddSellBopHelper mcpUrl={MCP_URL} onCopyMcpUrl={copyMcpUrl} onCopyName={copyConnectorName} />
                  <ConnectionSteps compact />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-black mb-1">Connect Claude</h2>
            <p className="text-sm text-neutral-500 mb-5">Give Claude secure access to your SellBop business.</p>

            <ShopAccessPicker hub={hub} accessMode={accessMode} onAccessModeChange={setAccessMode} />

            <div className="mt-6 space-y-4">
              <Button onClick={handleConnectClaude} loading={connecting} className="font-semibold text-white w-full sm:w-auto" style={{ background: '#00E676', borderColor: '#00E676' }}>
                Connect Claude <ExternalLink size={14} className="ml-1" />
              </Button>
              <AddSellBopHelper mcpUrl={MCP_URL} onCopyMcpUrl={copyMcpUrl} onCopyName={copyConnectorName} />
              <ConnectionSteps />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-6">
              <a href={CLAUDE_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                  <ExternalLink size={14} className="mr-1" /> Download Claude Desktop
                </Button>
              </a>
            </div>
            <p className="text-xs text-neutral-400 mt-3">Claude on the web works great — you don&apos;t need Claude Desktop unless you prefer it.</p>
          </>
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
        {showAdvanced && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4 text-xs font-mono space-y-2 text-neutral-600">
            <p><span className="text-neutral-400">MCP endpoint:</span> {mcpUrl}</p>
            {primary && <p><span className="text-neutral-400">Connection ID:</span> {primary.id}</p>}
            <p><span className="text-neutral-400">Access mode:</span> {primary?.access_mode ?? accessMode}</p>
            {primary && <p><span className="text-neutral-400">Scopes:</span> {primary.scopes.join(', ')}</p>}
            <Button size="xs" variant="secondary" onClick={copyMcpUrl}><Copy size={12} /> Copy MCP URL</Button>
          </div>
        )}
      </section>
    </div>
  )
}
