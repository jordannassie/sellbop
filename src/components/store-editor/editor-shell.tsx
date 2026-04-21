'use client'
import { useState } from 'react'
import { Pencil, LayoutGrid, Eye, ExternalLink, Copy, Check, Save } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EditorSidebar } from './editor-sidebar'
import { SectionArranger } from './section-arranger'
import { PreviewPanel } from './preview-panel'
import { useStoreEditor } from '@/context/store-editor-context'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'

type Tab = 'edit' | 'arrange' | 'preview'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'edit', label: 'Edit', icon: <Pencil size={13} /> },
  { id: 'arrange', label: 'Arrange', icon: <LayoutGrid size={13} /> },
  { id: 'preview', label: 'Preview', icon: <Eye size={13} /> },
]

// ── Top Header Bar ────────────────────────────────────────────
function EditorTopBar() {
  const { isDirty, isSaving, saveChanges } = useStoreEditor()
  const [copied, setCopied] = useState(false)
  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`

  function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.origin + storeUrl : storeUrl
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="h-12 bg-white border-b border-neutral-100 flex items-center justify-between px-4 shrink-0">
      {/* Left: title + unsaved indicator */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-black tracking-tight">Store Editor</h1>
        {isDirty && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={copyLink}
          title="Copy public link"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>
        <Link
          href={storeUrl}
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
        >
          <ExternalLink size={12} />
          Open Store
        </Link>
        <button
          onClick={saveChanges}
          disabled={!isDirty || isSaving}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all',
            isDirty && !isSaving
              ? 'bg-black text-white hover:bg-neutral-800 shadow-sm'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          <Save size={12} />
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main Shell ────────────────────────────────────────────────
export function StoreEditorShell() {
  const [activeTab, setActiveTab] = useState<Tab>('edit')

  return (
    <div className="flex flex-col h-screen lg:h-full">
      {/* Global top bar */}
      <EditorTopBar />

      {/* ── Desktop: 3-col layout ──────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[268px_1fr_360px] flex-1 min-h-0 divide-x divide-neutral-100">
        {/* Left — Edit Controls */}
        <div className="overflow-hidden flex flex-col">
          <EditorSidebar />
        </div>
        {/* Center — Section Arranger */}
        <div className="overflow-hidden flex flex-col bg-neutral-50/60">
          <SectionArranger />
        </div>
        {/* Right — Live Preview (sticky, fills remaining height) */}
        <div className="overflow-hidden flex flex-col">
          <PreviewPanel />
        </div>
      </div>

      {/* ── Mobile: tab layout ─────────────────────────────────── */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0">
        {/* Tab Bar */}
        <div className="flex border-b border-neutral-100 bg-white shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'text-black border-b-2 border-black'
                  : 'text-neutral-400 hover:text-black',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'edit' && (
            <div className="h-full overflow-y-auto">
              <EditorSidebar />
            </div>
          )}
          {activeTab === 'arrange' && (
            <div className="h-full overflow-hidden flex flex-col bg-neutral-50/60">
              <SectionArranger />
            </div>
          )}
          {activeTab === 'preview' && (
            <div className="h-full overflow-hidden flex flex-col">
              <PreviewPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
