'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClaudeConnectionState, type ClaudeConnectionState } from '@/lib/agent/connection-status'

interface ConnectionRow {
  id: string
  provider: string
  name: string
  token_prefix: string
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function ClaudeEcomCard() {
  const [connections, setConnections] = useState<ConnectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agent-connections', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Could not load connections.')
        }
        return res.json()
      })
      .then((data) => setConnections(data.connections ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const active = connections.filter(c => !c.revoked_at)
  const claudeConnections = active.filter(c => c.provider === 'claude')
  const state: ClaudeConnectionState = getClaudeConnectionState(active)
  const primary = claudeConnections[0] ?? active[0]

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="h-5 w-40 bg-neutral-100 rounded animate-pulse mb-3" />
        <div className="h-4 w-full bg-neutral-50 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-800">Claude E-Com unavailable</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    )
  }

  const isConnected = state === 'connected' || state === 'mcp_ready'

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white flex-shrink-0">
          <Bot size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-black">Claude E-Com</h3>
            {isConnected && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Claude Connected ✓
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Build and run your SellBop business with Claude.
          </p>

          {isConnected && primary ? (
            <div className="mt-3 space-y-1 text-xs text-neutral-600">
              <p><span className="text-neutral-400">Connection:</span> {primary.name}</p>
              <p><span className="text-neutral-400">Scopes:</span> {primary.scopes.join(', ')}</p>
              {primary.last_used_at && (
                <p><span className="text-neutral-400">Last activity:</span> {new Date(primary.last_used_at).toLocaleDateString()}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 mt-2">
              Give Claude secure access to build products, configure your Shop, and help operate your business.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!isConnected ? (
              <Link href="/dashboard/settings/ai-integrations">
                <Button size="sm" className="font-semibold text-white" style={{ background: '#00E676', borderColor: '#00E676' }}>
                  Connect Claude
                </Button>
              </Link>
            ) : (
              <>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary">
                    <ExternalLink size={13} /> Open Claude
                  </Button>
                </a>
                <Link href="/dashboard/settings/ai-integrations">
                  <Button size="sm" variant="secondary">Manage Access</Button>
                </Link>
              </>
            )}
            <Link href="/dashboard/settings/ai-integrations" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-black py-2">
              AI & Integrations <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
