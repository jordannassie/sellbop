'use client'
import { useState } from 'react'
import { Monitor, Smartphone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useStoreEditor } from '@/context/store-editor-context'
import { StorefrontPreview } from './storefront-preview'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

export function PreviewPanel() {
  const { config, products } = useStoreEditor()
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-black">Live Preview</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Updates as you edit</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop / Mobile toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('desktop')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'desktop' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black',
              )}
            >
              <Monitor size={12} /> Desktop
            </button>
            <button
              onClick={() => setMode('mobile')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'mobile' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black',
              )}
            >
              <Smartphone size={12} /> Mobile
            </button>
          </div>
          <Link
            href={storeUrl}
            target="_blank"
            title="Open live store"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-neutral-400 transition-colors"
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-4">
        {mode === 'desktop' ? (
          // Full-width desktop preview — scaled to fit the panel
          <div
            className="w-full h-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-y-auto"
            style={{ minHeight: 0 }}
          >
            <div className="origin-top-left" style={{ width: '100%' }}>
              <StorefrontPreview config={config} products={products} />
            </div>
          </div>
        ) : (
          // Mobile preview — phone frame
          <div className="flex items-start justify-center w-full h-full">
            <div
              className="relative bg-white rounded-[2rem] border-4 border-neutral-800 shadow-2xl overflow-hidden flex-shrink-0"
              style={{ width: 320, height: 620 }}
            >
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-neutral-800 rounded-b-2xl z-10" />
              {/* Scrollable content */}
              <div className="absolute inset-0 overflow-y-auto pt-5">
                <div
                  style={{
                    width: 390,
                    transformOrigin: 'top left',
                    transform: 'scale(0.82)',
                    transformBox: 'border-box',
                  }}
                >
                  <StorefrontPreview config={config} products={products} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
