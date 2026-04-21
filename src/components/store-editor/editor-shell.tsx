'use client'
import { useState } from 'react'
import { Pencil, LayoutGrid, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorSidebar } from './editor-sidebar'
import { SectionArranger } from './section-arranger'
import { PreviewPanel } from './preview-panel'

type Tab = 'edit' | 'arrange' | 'preview'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'edit', label: 'Edit', icon: <Pencil size={14} /> },
  { id: 'arrange', label: 'Arrange', icon: <LayoutGrid size={14} /> },
  { id: 'preview', label: 'Preview', icon: <Eye size={14} /> },
]

export function StoreEditorShell() {
  const [activeTab, setActiveTab] = useState<Tab>('edit')

  return (
    <>
      {/* ── Desktop: 3-col layout ──────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_380px] h-[calc(100vh-3.5rem)] divide-x divide-neutral-100">
        {/* Left — Edit Controls */}
        <div className="overflow-hidden flex flex-col">
          <EditorSidebar />
        </div>
        {/* Center — Section Arranger */}
        <div className="overflow-hidden flex flex-col bg-neutral-50">
          <SectionArranger />
        </div>
        {/* Right — Live Preview */}
        <div className="overflow-hidden flex flex-col">
          <PreviewPanel />
        </div>
      </div>

      {/* ── Mobile: tab layout ─────────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Tab Bar */}
        <div className="flex border-b border-neutral-200 bg-white">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'text-black border-b-2 border-black'
                  : 'text-neutral-500 hover:text-black',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'edit' && (
            <div className="h-full overflow-y-auto">
              <EditorSidebar />
            </div>
          )}
          {activeTab === 'arrange' && (
            <div className="h-full overflow-hidden flex flex-col bg-neutral-50">
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
    </>
  )
}
