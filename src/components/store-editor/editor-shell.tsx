'use client'
import { useState } from 'react'
import { Pencil, LayoutGrid, ExternalLink, Copy, Check, CloudUpload } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EditorSidebar } from './editor-sidebar'
import { SectionArranger } from './section-arranger'
import { useStoreEditor } from '@/context/store-editor-context'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'

type Tab = 'edit' | 'arrange'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'edit',    label: 'Edit',    icon: <Pencil size={13} /> },
  { id: 'arrange', label: 'Arrange', icon: <LayoutGrid size={13} /> },
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
    <div className="h-14 bg-white border-b border-neutral-150 flex items-center justify-between px-4 shrink-0 shadow-[0_1px_0_0_#e5e5e5]">
      {/* Left: title + dirty badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-sm font-bold text-black tracking-tight leading-none">Store Editor</h1>
          <p className="text-[10px] text-neutral-400 leading-none mt-0.5 hidden sm:block">Edit your storefront</p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="hidden sm:inline">Unsaved changes</span>
            <span className="sm:hidden">Unsaved</span>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Copy link */}
        <button
          onClick={copyLink}
          title="Copy public link"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        {/* Open Store — opens live storefront in new tab */}
        <Link
          href={storeUrl}
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <ExternalLink size={12} />
          Open Store
        </Link>

        {/* Save */}
        <button
          onClick={saveChanges}
          disabled={!isDirty || isSaving}
          className={cn(
            'flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold transition-all duration-150',
            isDirty && !isSaving
              ? 'bg-black text-white hover:bg-neutral-800 shadow-sm ring-1 ring-black/20'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          <CloudUpload size={13} />
          {isSaving ? 'Saving…' : 'Save Changes'}
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
      <EditorTopBar />

      {/* ── Desktop: 2-col layout ──────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr] flex-1 min-h-0 divide-x divide-neutral-100">
        {/* Left — Edit Controls */}
        <div className="overflow-hidden flex flex-col bg-white">
          <EditorSidebar />
        </div>
        {/* Right — Store Structure */}
        <div className="overflow-hidden flex flex-col bg-[#f8f8f8]">
          <SectionArranger />
        </div>
      </div>

      {/* ── Mobile: 2-tab layout ───────────────────────────────── */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0">
        {/* Tab Bar */}
        <div className="flex border-b border-neutral-100 bg-white shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'text-black border-b-2 border-black'
                  : 'text-neutral-400 hover:text-neutral-700',
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
            <div className="h-full overflow-y-auto bg-white">
              <EditorSidebar />
            </div>
          )}
          {activeTab === 'arrange' && (
            <div className="h-full overflow-hidden flex flex-col bg-[#f8f8f8]">
              <SectionArranger />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
