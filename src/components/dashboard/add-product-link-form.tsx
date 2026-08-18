'use client'

import { useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { normalizeProductLinkUrl, productLinkDisplayName } from '@/lib/product-files/url'

interface AddProductLinkFormProps {
  onAdd: (link: { url: string; name: string }) => void | Promise<void>
  disabled?: boolean
  hasFiles?: boolean
}

export function AddProductLinkForm({ onAdd, disabled, hasFiles }: AddProductLinkFormProps) {
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizeProductLinkUrl(url)
    if (!normalized) {
      toast.error('Enter a valid URL (e.g. https://notion.so/your-page)')
      return
    }

    setAdding(true)
    try {
      await onAdd({
        url: normalized,
        name: productLinkDisplayName(normalized),
      })
      setUrl('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add link.')
    } finally {
      setAdding(false)
    }
  }

  const normalized = normalizeProductLinkUrl(url)
  const canSubmit = !!normalized && !disabled && !adding

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <Link2 size={12} />
          {hasFiles ? 'or add a website link' : 'or add a website link instead'}
        </span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://notion.so/your-page"
          disabled={disabled || adding}
          className="flex-1 min-w-0 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
        />
        <Button type="submit" variant="secondary" disabled={!canSubmit} loading={adding} className="shrink-0">
          <Plus size={14} />
          Add Link
        </Button>
      </div>
      <p className="text-xs text-neutral-400">
        Buyers get this link after purchase — great for Notion pages, Google Docs, course sites, and more.
      </p>
    </form>
  )
}
