'use client'
import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStoreEditor } from '@/context/store-editor-context'
import { StorefrontPreview } from './storefront-preview'

export function PreviewPanel() {
  const { config, products } = useStoreEditor()
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Toolbar */}
      <div className="px-3 py-2.5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
        <p className="text-xs font-semibold text-neutral-700">Live Preview</p>
        {/* Desktop / Mobile toggle */}
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 gap-0">
          <button
            onClick={() => setMode('desktop')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
              mode === 'desktop' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-700',
            )}
          >
            <Monitor size={11} /> Desktop
          </button>
          <button
            onClick={() => setMode('mobile')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
              mode === 'mobile' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-700',
            )}
          >
            <Smartphone size={11} /> Mobile
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-start justify-center">
        {mode === 'desktop' ? (
          <DesktopPreview config={config} products={products} />
        ) : (
          <MobilePreview config={config} products={products} />
        )}
      </div>
    </div>
  )
}

// ── Desktop Preview ───────────────────────────────────────────
function DesktopPreview({ config, products }: { config: Parameters<typeof StorefrontPreview>[0]['config'], products: Parameters<typeof StorefrontPreview>[0]['products'] }) {
  return (
    <div className="w-full h-full p-3">
      {/* Browser chrome mockup */}
      <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-neutral-300 shadow-md bg-white">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 border-b border-neutral-200 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md px-2.5 py-1 text-[10px] text-neutral-400 border border-neutral-200 truncate font-mono">
            sellbop.com/{config.slug}
          </div>
        </div>
        {/* Page content scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <StorefrontPreview config={config} products={products} />
        </div>
      </div>
    </div>
  )
}

// ── Mobile Preview ────────────────────────────────────────────
function MobilePreview({ config, products }: { config: Parameters<typeof StorefrontPreview>[0]['config'], products: Parameters<typeof StorefrontPreview>[0]['products'] }) {
  return (
    <div className="flex items-start justify-center w-full h-full py-4">
      {/* Phone shell */}
      <div
        className="relative flex-shrink-0 bg-neutral-900 rounded-[40px] shadow-2xl"
        style={{ width: 260, height: 540 }}
      >
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-20 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-32 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-44 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-28 w-[3px] h-12 bg-neutral-700 rounded-r-sm" />

        {/* Screen */}
        <div
          className="absolute bg-white overflow-hidden"
          style={{
            top: 10, left: 10, right: 10, bottom: 10,
            borderRadius: 32,
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-neutral-900 z-10 flex items-center justify-center"
            style={{ top: 8, width: 80, height: 22, borderRadius: 14 }}
          >
            {/* Camera dot */}
            <div className="absolute right-3 w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 pt-2 pb-0" style={{ paddingTop: 36 }}>
            <span className="text-[8px] font-bold text-black">9:41</span>
            <div className="flex items-center gap-1">
              {/* Signal bars */}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor" className="text-black">
                <rect x="0" y="5" width="2" height="3" rx="0.5" />
                <rect x="3" y="3" width="2" height="5" rx="0.5" />
                <rect x="6" y="1" width="2" height="7" rx="0.5" />
                <rect x="9" y="0" width="2" height="8" rx="0.5" />
              </svg>
              {/* Battery */}
              <svg width="18" height="9" viewBox="0 0 18 9" fill="none" className="text-black">
                <rect x="0.5" y="0.5" width="15" height="8" rx="2" stroke="currentColor" strokeWidth="1" />
                <rect x="1.5" y="1.5" width="11" height="6" rx="1.5" fill="currentColor" />
                <path d="M16.5 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Scrollable store content — scaled to fit */}
          <div
            className="absolute overflow-y-auto overflow-x-hidden"
            style={{ top: 62, left: 0, right: 0, bottom: 20 }}
          >
            <div
              style={{
                width: 390,
                transformOrigin: 'top left',
                transform: `scale(${240 / 390})`,
              }}
            >
              <StorefrontPreview config={config} products={products} />
            </div>
          </div>

          {/* Home indicator */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/20 rounded-full"
            style={{ width: 80, height: 4 }}
          />
        </div>
      </div>
    </div>
  )
}
