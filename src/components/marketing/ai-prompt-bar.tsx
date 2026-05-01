'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { saveLaunchIdea } from '@/lib/launch-idea'

export function AIPromptBar() {
  const router = useRouter()
  const { session } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')

  function handleBuild(text?: string) {
    const q = (text ?? prompt).trim()
    setError('')

    if (!q) {
      setError('Tell us what you want to sell first.')
      return
    }

    // Persist to localStorage — survives OAuth redirects
    saveLaunchIdea(q)

    if (session) {
      // Already logged in → straight to AI Launch Assistant
      router.push(`/dashboard/ai-launch?idea=${encodeURIComponent(q)}`)
    } else {
      // Not logged in → login/signup with intent preserved
      router.push(`/login?intent=store_launch&idea=${encodeURIComponent(q)}`)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Desktop: single-row pill */}
      <div className="hidden sm:flex gap-2 p-1.5 bg-white rounded-2xl border border-neutral-200 shadow-sm focus-within:border-neutral-300 focus-within:shadow-md transition-all">
        <input
          type="text"
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleBuild()}
          placeholder="What do you want to sell?"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none"
        />
        <button
          onClick={() => handleBuild()}
          className="flex items-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-neutral-800 active:scale-95 transition-all shrink-0"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-center bg-white rounded-2xl border border-neutral-200 shadow-sm px-3">
          <input
            type="text"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleBuild()}
            placeholder="What do you want to sell?"
            className="flex-1 bg-transparent py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => handleBuild()}
          className="w-full flex items-center justify-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-3 rounded-2xl hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      {/* Helper / validation */}
      {error ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-red-500 mt-2">
          <AlertCircle size={11} />
          {error}
        </p>
      ) : (
        <p className="text-xs text-neutral-400 text-center mt-2">
          Try: &ldquo;Clothing and merch, a $29 Notion template, coaching calls, or a monthly membership.&rdquo;
        </p>
      )}
    </div>
  )
}
