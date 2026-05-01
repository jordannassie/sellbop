'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function AIPromptBar() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  function handleBuild(text?: string) {
    const q = (text ?? prompt).trim()
    if (q) {
      router.push(`/dashboard/ai-launch?prompt=${encodeURIComponent(q)}`)
    } else {
      router.push('/dashboard/ai-launch')
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Desktop: single-row pill. Mobile: stacked input + full-width button */}
      <div className="hidden sm:flex gap-2 p-1.5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBuild()}
          placeholder="What do you want to sell?"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none"
        />
        <button
          onClick={() => handleBuild()}
          className="flex items-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      {/* Mobile stacked layout */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-center bg-white rounded-2xl border border-neutral-200 shadow-sm px-3">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuild()}
            placeholder="What do you want to sell?"
            className="flex-1 bg-transparent py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => handleBuild()}
          className="w-full flex items-center justify-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-3 rounded-2xl hover:bg-neutral-800 transition-colors"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      <p className="text-xs text-neutral-400 text-center mt-2">
        Try: &ldquo;I want to sell a $29 Notion template for creators.&rdquo;
      </p>
    </div>
  )
}
