'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bot, Copy, Loader2, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'

const MCP_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/mcp`
    : 'https://sellbop.com/api/mcp'

const HIGGSFIELD_MCP_URL = 'https://mcp.higgsfield.ai/mcp'

type Provider = 'claude' | 'higgsfield' | 'chatgpt' | 'custom'

interface Connection {
  id: string
  provider: Provider
  name: string
  token_prefix: string
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

interface ActivityEntry {
  id: string
  connection_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  status: 'ok' | 'error'
  error_message: string | null
  created_at: string
}

const PROVIDERS: { key: Provider; label: string; blurb: string }[] = [
  { key: 'claude', label: 'Claude', blurb: 'Connect via MCP — recommended.' },
  { key: 'higgsfield', label: 'Higgsfield', blurb: 'Image/video generation tools.' },
  { key: 'chatgpt', label: 'ChatGPT', blurb: 'Or any custom GPT / tool.' },
  { key: 'custom', label: 'Other / Custom', blurb: 'Any MCP or REST-capable client.' },
]

const SCOPE_OPTIONS: { key: string; label: string; blurb: string }[] = [
  { key: 'products:read', label: 'Read products', blurb: 'View store and product details.' },
  { key: 'products:write', label: 'Create & edit products', blurb: 'Create products, edit text/price, publish/unpublish.' },
  { key: 'files:write', label: 'Upload files & images', blurb: 'Upload downloadable files and cover images.' },
  { key: 'affiliates:write', label: 'Manage affiliates', blurb: 'Enable/disable affiliates, set commission %.' },
]

export default function AiIntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<Provider>('claude')
  const [scopes, setScopes] = useState<string[]>(['products:read', 'products:write', 'files:write', 'affiliates:write'])
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [connRes, actRes] = await Promise.all([
        fetch('/api/agent-connections'),
        fetch('/api/agent-connections/activity'),
      ])
      const connData = await connRes.json()
      const actData = await actRes.json()
      setConnections(connData.connections ?? [])
      setActivity(actData.activity ?? [])
    } catch {
      toast.error('Failed to load AI integrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  function toggleScope(key: string) {
    setScopes(prev => (prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Give this connection a name.'); return }
    if (scopes.length === 0) { toast.error('Select at least one permission.'); return }

    setCreating(true)
    try {
      const res = await fetch('/api/agent-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), provider, scopes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create connection.')
      setNewToken(data.token)
      setName('')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create connection.')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this connection? Any AI agent using this token will immediately lose access.')) return
    try {
      const res = await fetch(`/api/agent-connections/${id}/revoke`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to revoke.')
      toast.success('Connection revoked.')
      load()
    } catch {
      toast.error('Failed to revoke connection.')
    }
  }

  function copyToken() {
    if (!newToken) return
    navigator.clipboard.writeText(newToken)
    toast.success('Token copied.')
  }

  function copyMcpUrl() {
    navigator.clipboard.writeText(MCP_URL)
    toast.success('MCP URL copied.')
  }

  function copyHiggsfieldUrl() {
    navigator.clipboard.writeText(HIGGSFIELD_MCP_URL)
    toast.success('Higgsfield MCP URL copied.')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <Bot size={22} /> AI & Integrations
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Let Claude and other AI tools create and manage products in your store — securely, and only with the
          permissions you choose.
        </p>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Connect Claude</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-600">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Create a Claude connection below and copy your token.</li>
              <li>Open Claude → Customize → Connectors → Add SellBop.</li>
              <li>Paste the MCP URL and your token when prompted.</li>
              <li>Ask Claude to create products in your SellBop store.</li>
            </ol>
            <div className="flex items-center gap-2 pt-1">
              <code className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">{MCP_URL}</code>
              <Button size="sm" variant="secondary" onClick={copyMcpUrl}><Copy size={13} /></Button>
            </div>
            <p className="text-xs text-neutral-400">Powered by MCP · See AGENT-API.md for full REST API docs.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect Higgsfield</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-600">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Copy the Higgsfield MCP URL below.</li>
              <li>Open Claude → Customize → Connectors → Add Higgsfield.</li>
              <li>Paste the URL when prompted.</li>
              <li>Sign in to Higgsfield, then ask Claude to generate product images or videos.</li>
            </ol>
            <div className="flex items-center gap-2 pt-1">
              <code className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">{HIGGSFIELD_MCP_URL}</code>
              <Button size="sm" variant="secondary" onClick={copyHiggsfieldUrl}><Copy size={13} /></Button>
            </div>
            <p className="text-xs text-neutral-400">
              Powered by MCP · Higgsfield connects directly to Claude — once both Claude and Higgsfield are
              connected, Claude can generate a product image or video and upload it straight into your SellBop
              product draft.
            </p>
          </CardContent>
        </Card>

        {/* New-token reveal (shown once) */}
        {newToken && (
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck size={16} /> Copy your token now</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-3">
                This is the only time this token is shown. Paste it into your AI tool&apos;s connection settings.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">{newToken}</code>
                <Button size="sm" variant="secondary" onClick={copyToken}><Copy size={13} /></Button>
              </div>
              <Button size="sm" variant="ghost" className="mt-3" onClick={() => setNewToken(null)}>Done</Button>
            </CardContent>
          </Card>
        )}

        {/* Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Connected AI Tools</CardTitle>
            <Button size="sm" onClick={() => setShowCreate(v => !v)}>
              <Plus size={14} /> Connect a tool
            </Button>
          </CardHeader>
          <CardContent>
            {showCreate && (
              <form onSubmit={handleCreate} className="mb-6 space-y-4 rounded-xl border border-neutral-200 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDERS.map(p => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => setProvider(p.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        provider === p.key ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-black flex items-center gap-1.5">
                        <Sparkles size={13} /> {p.label}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{p.blurb}</p>
                    </button>
                  ))}
                </div>

                <Input
                  label="Connection name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Claude — product launches"
                />

                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {SCOPE_OPTIONS.map(s => (
                      <label key={s.key} className="flex items-start gap-2.5 rounded-lg border border-neutral-200 p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={scopes.includes(s.key)}
                          onChange={() => toggleScope(s.key)}
                        />
                        <span>
                          <span className="block text-sm text-neutral-800">{s.label}</span>
                          <span className="block text-xs text-neutral-400">{s.blurb}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Deleting products, refunds, payouts, and Stripe settings are never exposed to AI tools.
                  </p>
                </div>

                <Button type="submit" loading={creating}>Create connection</Button>
              </form>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={18} /></div>
            ) : connections.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4">No AI tools connected yet.</p>
            ) : (
              <div className="space-y-2">
                {connections.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-black">{c.name}</p>
                        <Badge variant="neutral">{c.provider}</Badge>
                        {c.revoked_at ? (
                          <Badge variant="danger">Revoked</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">{c.token_prefix}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {c.scopes.join(', ')} · {c.last_used_at ? `last used ${new Date(c.last_used_at).toLocaleString()}` : 'never used'}
                      </p>
                    </div>
                    {!c.revoked_at && (
                      <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleRevoke(c.id)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity log */}
        <Card>
          <CardHeader>
            <CardTitle>AI Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4">No AI activity yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {activity.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 last:border-0">
                    <span className="text-neutral-700">
                      <span className="font-mono">{a.action}</span>
                      {a.target_type && <span className="text-neutral-400"> · {a.target_type}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {a.status === 'error' && <Badge variant="danger">failed</Badge>}
                      <span className="text-neutral-400">{new Date(a.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
