'use client'
import { useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Defaults (exported so pages can import and customise) ─────────────────────

export const DEFAULT_TYPE_CHIPS = [
  'Digital product',
  'Membership',
  'Coaching',
  'Course',
  'Subscription',
  'Bundle',
] as const

export const DEFAULT_QUICK_PROMPTS = [
  'A $29 Notion template for creators',
  'A monthly fitness membership',
  'A 1-on-1 coaching offer',
  'A course on building with AI',
  'A digital bundle for churches',
] as const

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AiComposerProps {
  value: string
  onChange: (v: string) => void
  /** Called with the current value when user submits (button click or ⌘ Enter). */
  onSubmit: (v: string) => void
  loading?: boolean
  placeholder?: string
  submitLabel?: string
  /** Number of visible textarea rows. Defaults to 3. */
  rows?: number
  /** Whether to render type-chips and quick-prompt chips. Defaults to true. */
  showChips?: boolean
  /** Override the product-type pill chips. */
  typeChips?: readonly string[]
  /** Override the example prompt chips below. Pass empty array to hide. */
  quickPrompts?: readonly string[]
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiComposer({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = 'Describe what you want to sell and SellBop will build your store.',
  submitLabel = 'Build My Store',
  rows = 3,
  showChips = true,
  typeChips = DEFAULT_TYPE_CHIPS,
  quickPrompts = DEFAULT_QUICK_PROMPTS,
  className,
}: AiComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && value.trim() && !loading) {
      e.preventDefault()
      onSubmit(value)
    }
  }

  function applyText(text: string) {
    onChange(text)
    textareaRef.current?.focus()
  }

  function applyTypeChip(chip: string) {
    // Prepend the type chip to any existing value, or just set it
    const trimmed = value.trim()
    applyText(trimmed ? `${chip} — ${trimmed}` : `${chip}: `)
  }

  const canSubmit = value.trim().length > 0 && !loading

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── Composer box ───────────────────────────────────────── */}
      <div
        className={cn(
          'rounded-2xl border-2 bg-white transition-all duration-200',
          loading
            ? 'border-neutral-200 opacity-80 shadow-sm'
            : 'border-neutral-200 shadow-sm hover:shadow-md focus-within:border-black focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.08)]',
        )}
      >
        {/* Input row: icon + textarea */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          {/* Sparkle icon */}
          <div
            className={cn(
              'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
              loading ? 'bg-neutral-200' : 'bg-black',
            )}
          >
            {loading
              ? <Loader2 size={15} className="text-neutral-500 animate-spin" />
              : <Sparkles size={15} className="text-white" />
            }
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              'flex-1 resize-none bg-transparent py-0.5 text-sm leading-relaxed text-neutral-900',
              'placeholder:text-neutral-400 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          />
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
          <span className="hidden select-none text-[11px] text-neutral-400 sm:block">
            {loading ? 'SellBop is building your store…' : '⌘ Enter to submit'}
          </span>

          <button
            type="button"
            onClick={() => canSubmit && onSubmit(value)}
            disabled={!canSubmit}
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150',
              canSubmit
                ? 'bg-black text-white shadow-sm hover:bg-neutral-800 hover:shadow-md active:scale-95'
                : 'cursor-not-allowed bg-neutral-100 text-neutral-400',
            )}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Building...</>
              : <><Sparkles size={13} /> {submitLabel}</>
            }
          </button>
        </div>
      </div>

      {/* ── Suggestion chips ───────────────────────────────────── */}
      {showChips && !loading && (
        <div className="space-y-2.5">
          {/* Product-type chips */}
          {typeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {typeChips.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => applyTypeChip(chip)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-800 hover:bg-neutral-50 hover:text-black"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Quick-prompt examples */}
          {quickPrompts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Try one of these
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => applyText(prompt)}
                    className="rounded-full border border-dashed border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-white hover:text-black"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
