'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  ImageIcon,
  MessageSquare,
  Package,
  Sparkles,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { INTEGRATIONS } from '@/lib/resources/defaults'

const CLAUDE = INTEGRATIONS.claude
const HIGGSFIELD = INTEGRATIONS.higgsfield

const MAIN_PROMPT =
  'Create me a $49 digital product for Airbnb hosts. Build the files, create the SellBop listing, set affiliates to 30%, and leave it as a draft for me to review.'

const EXAMPLE_PROMPTS = [
  {
    label: 'Real Estate',
    text: 'Create a digital product for real estate agents that helps them get more leads.',
  },
  {
    label: 'Fitness',
    text: 'Create a $29 digital product for personal trainers that saves them time.',
  },
  {
    label: 'Small Business',
    text: 'Create a useful spreadsheet or calculator for small business owners.',
  },
]

const FLOW_STEPS = [
  { label: 'Tell Claude', icon: MessageSquare },
  { label: 'Create Product', icon: Package },
  { label: 'Generate Visuals', icon: ImageIcon },
  { label: 'Add to SellBop', icon: Store },
  { label: 'Review', icon: Check },
  { label: 'Sell', icon: Sparkles },
]

function CopyButton({ text, label = 'Copy Prompt' }: { text: string; label?: string }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        navigator.clipboard.writeText(text)
        toast.success('Prompt copied.')
      }}
    >
      <Copy size={13} /> {label}
    </Button>
  )
}

function ExpandableHelp({
  label,
  children,
  defaultOpen = false,
}: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3 pt-3 border-t border-neutral-100">{children}</div>}
    </div>
  )
}

function StatusBadge({ connected, setupGuide }: { connected?: boolean; setupGuide?: boolean }) {
  if (setupGuide) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
        Setup Guide
      </span>
    )
  }
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        <Check size={12} /> Connected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-500">
      Not Connected
    </span>
  )
}

export function ConnectAiPage() {
  const [claudeConnected, setClaudeConnected] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const mcpUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'https://sellbop.com/api/mcp'

  useEffect(() => {
    fetch('/api/agent-connections')
      .then(r => (r.ok ? r.json() : { connections: [] }))
      .then(data => {
        const active = (data.connections ?? []).some(
          (c: { provider: string; revoked_at: string | null }) =>
            c.provider === 'claude' && !c.revoked_at,
        )
        setClaudeConnected(active)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/resources"
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-black mb-4 transition-colors"
      >
        ← Resources
      </Link>

      {/* Hero */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
          AI Product Builder
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-black leading-tight">
          Connect your tools. Start building.
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-500 max-w-xl leading-relaxed">
          Claude builds the product. Higgsfield creates the visuals. SellBop helps you sell it.
        </p>
      </div>

      {/* 3-step setup */}
      <div className="space-y-4 mb-8">
        {/* Step 1 — Claude */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CLAUDE.image_url}
              alt="Claude"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-black">1. Connect Claude</h2>
                <StatusBadge connected={claudeConnected} />
              </div>
              <p className="text-sm text-neutral-500 mb-4">
                Let Claude create and manage products in your SellBop store.
              </p>
              <Link href="/dashboard/settings/ai-integrations">
                <Button className="font-bold">
                  Connect Claude <ArrowRight size={14} />
                </Button>
              </Link>
              <p className="text-[10px] text-neutral-400 mt-2">{CLAUDE.powered_by}</p>

              <ExpandableHelp label="How do I connect Claude?">
                <p className="text-sm font-semibold text-black mb-2">{CLAUDE.steps_title}</p>
                <ol className="space-y-2 mb-4">
                  {CLAUDE.steps?.map((step, i) => (
                    <li key={step} className="flex gap-2 text-sm text-neutral-600">
                      <span className="font-bold text-black flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {CLAUDE.features.slice(0, 6).map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Check size={12} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </ExpandableHelp>
            </div>
          </div>
        </div>

        {/* Step 2 — Higgsfield */}
        <div id="higgsfield" className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm scroll-mt-6">
          <div className="flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HIGGSFIELD.image_url}
              alt="Higgsfield"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-black">2. Connect Higgsfield</h2>
                <StatusBadge setupGuide />
              </div>
              <p className="text-sm text-neutral-500 mb-2">
                Create product covers, mockups, social graphics, images, and videos with AI.
              </p>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Higgsfield connects to Claude. Claude then uses it when building your SellBop products.
              </p>
              <a href={HIGGSFIELD.cta_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="font-bold">
                  Connect Higgsfield <ExternalLink size={14} />
                </Button>
              </a>
              <p className="text-[10px] text-neutral-400 mt-2">{HIGGSFIELD.powered_by}</p>

              <ExpandableHelp label="How do I connect Higgsfield?">
                <p className="text-sm font-semibold text-black mb-2">{HIGGSFIELD.steps_title}</p>
                <ol className="space-y-2 mb-3">
                  {HIGGSFIELD.steps?.map((step, i) => (
                    <li key={step} className="flex gap-2 text-sm text-neutral-600">
                      <span className="font-bold text-black flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-neutral-400 font-mono break-all">
                  Higgsfield MCP URL: https://mcp.higgsfield.ai/mcp
                </p>
              </ExpandableHelp>
            </div>
          </div>
        </div>

        {/* Step 3 — Build */}
        <div
          className="rounded-2xl border-2 bg-white p-5 sm:p-6 shadow-sm"
          style={{ borderColor: 'rgba(0,230,118,0.35)' }}
        >
          <h2 className="text-lg font-bold text-black mb-1">3. Tell Claude what to build</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Once Claude and SellBop are connected, just describe the product you want.
          </p>

          <div className="rounded-xl bg-neutral-900 p-4 mb-3">
            <p className="text-sm text-white leading-relaxed">&ldquo;{MAIN_PROMPT}&rdquo;</p>
          </div>
          <CopyButton text={MAIN_PROMPT} />

          <div className="mt-5 space-y-3">
            {EXAMPLE_PROMPTS.map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 sm:p-4"
              >
                <p className="text-xs font-bold text-neutral-400 mb-1">{item.label}</p>
                <p className="text-sm text-neutral-600 italic mb-2">&ldquo;{item.text}&rdquo;</p>
                <CopyButton text={item.text} label="Copy" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact workflow */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-5 mb-8 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-neutral-200"
                  >
                    <Icon size={16} className="text-black" />
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-600 text-center leading-tight">
                    {step.label}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-300 flex-shrink-0 mb-4" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* What happens */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-black mb-4">
          What happens when you ask Claude to build?
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Claude',
              action: 'Creates',
              items: ['product idea', 'copy', 'files', 'pricing'],
            },
            {
              title: 'Higgsfield',
              action: 'Generates',
              items: ['covers', 'mockups', 'graphics', 'videos'],
            },
            {
              title: 'SellBop',
              action: 'Sells',
              items: ['product page', 'checkout', 'affiliates', 'delivery'],
            },
          ].map(col => (
            <div key={col.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="font-bold text-black">{col.title}</p>
              <p className="text-xs text-neutral-400 mb-2">{col.action}</p>
              <ul className="space-y-1">
                {col.items.map(item => (
                  <li key={item} className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <Check size={12} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Setup */}
      <div className="rounded-2xl border border-neutral-200 bg-white mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-bold text-black">Advanced Setup</span>
          <ChevronDown size={16} className={`text-neutral-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {advancedOpen && (
          <div className="px-5 pb-5 pt-0 border-t border-neutral-100 space-y-4 text-sm text-neutral-600">
            <div>
              <p className="font-semibold text-black mb-1">SellBop MCP URL</p>
              <code className="block rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">{mcpUrl}</code>
            </div>
            <div>
              <p className="font-semibold text-black mb-1">Higgsfield MCP URL</p>
              <code className="block rounded-lg bg-neutral-100 px-3 py-2 text-xs font-mono break-all">
                https://mcp.higgsfield.ai/mcp
              </code>
            </div>
            <div>
              <p className="font-semibold text-black mb-1">Bearer token</p>
              <p className="text-sm leading-relaxed">
                Create a scoped token in Settings → AI & Integrations. Use it as{' '}
                <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">Authorization: Bearer sk_agent_live_…</code>{' '}
                when connecting Claude or other MCP clients.
              </p>
            </div>
            <div>
              <p className="font-semibold text-black mb-1">Connector details</p>
              <p className="text-sm leading-relaxed">
                Claude connects via MCP (Streamable HTTP). Higgsfield connects as a custom connector inside Claude.
                See <Link href="/dashboard/settings/ai-integrations" className="underline">AI & Integrations</Link> or{' '}
                <span className="font-mono text-xs">AGENT-API.md</span> for the full REST API reference.
              </p>
            </div>
            <p className="text-xs text-neutral-400">
              Troubleshooting: ensure your token has the required permissions and has not been revoked.
            </p>
          </div>
        )}
      </div>

      {/* Troubleshooting */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-bold text-black mb-3">Having trouble connecting?</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            View Setup Help
          </Button>
          <Link href="/support">
            <Button size="sm" variant="ghost">
              Contact Support <ExternalLink size={13} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
