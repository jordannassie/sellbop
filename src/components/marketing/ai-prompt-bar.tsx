'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Sparkles, Wand2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { saveLaunchIdea } from '@/lib/launch-idea'
import { cn } from '@/lib/utils'

const CHIPS = [
  'Clothing and merch',
  'A $29 Notion template',
  'Coaching calls',
  'Monthly membership',
  'Digital bundle',
  'Online course',
]

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
      // Not logged in → open signup tab by default
      router.push(`/login?mode=signup&intent=store_launch&idea=${encodeURIComponent(q)}`)
    }
  }

  function fillChip(chip: string) {
    setPrompt(chip)
    setError('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Desktop: icon + input + button in one spacious row ── */}
      <div className="hidden sm:flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 shadow-md focus-within:border-neutral-300 focus-within:shadow-lg transition-all px-3 py-2">
        {/* Wand icon */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black flex-shrink-0">
          <Wand2 size={15} className="text-white" />
        </div>
        {/* Input */}
        <input
          type="text"
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleBuild()}
          placeholder="What do you want to sell?"
          className="flex-1 bg-transparent text-base text-black placeholder:text-neutral-400 focus:outline-none py-2 min-w-0"
        />
        {/* Button */}
        <button
          onClick={() => handleBuild()}
          className="flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 active:scale-95 transition-all shrink-0"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      {/* ── Mobile: stacked layout ─────────────────────────────── */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 shadow-sm px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black flex-shrink-0">
            <Wand2 size={13} className="text-white" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleBuild()}
            placeholder="What do you want to sell?"
            className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => handleBuild()}
          className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-bold px-4 py-3.5 rounded-2xl hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <Sparkles size={13} />
          Build My Store
        </button>
      </div>

      {/* ── Suggestion chips ───────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => fillChip(chip)}
            className={cn(
              'h-7 px-3 rounded-full text-xs font-medium transition-colors',
              prompt === chip
                ? 'bg-black text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300',
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ── Validation / helper text ───────────────────────────── */}
      {error ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-red-500 mt-2.5">
          <AlertCircle size={11} />
          {error}
        </p>
      ) : (
        <p className="text-xs text-neutral-400 text-center mt-2.5">
          Click a chip above or type your own idea, then click{' '}
          <span className="font-medium text-neutral-500">Build My Store</span>.
        </p>
      )}

    </div>
  )
}
