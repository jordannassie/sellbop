'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ResourceCardRow, ResourcePageRow } from '@/lib/resources/types'

export function ResourcesAdminSection() {
  const [pages, setPages] = useState<ResourcePageRow[]>([])
  const [cards, setCards] = useState<ResourceCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/resources')
      .then(r => r.json())
      .then(data => {
        setPages(data.pages ?? [])
        setCards(data.cards ?? [])
        if (data.pages?.[0]) setSelectedPage(data.pages[0].slug)
      })
      .finally(() => setLoading(false))
  }, [])

  const page = pages.find(p => p.slug === selectedPage)

  async function savePage(patch: Partial<ResourcePageRow>) {
    if (!page || page.id.startsWith('default-')) {
      toast.error('Run migration 013/014 in Supabase to enable editing.')
      return
    }
    const res = await fetch('/api/admin/resources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'page', id: page.id, patch }),
    })
    if (!res.ok) {
      toast.error('Save failed')
      return
    }
    const data = await res.json()
    setPages(prev => prev.map(p => (p.id === page.id ? data.item : p)))
    toast.success('Page saved')
  }

  async function saveCard(card: ResourceCardRow, patch: Partial<ResourceCardRow>) {
    if (card.id.startsWith('default-')) {
      toast.error('Run migration 013/014 in Supabase to enable editing.')
      return
    }
    const res = await fetch('/api/admin/resources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'card', id: card.id, patch }),
    })
    if (!res.ok) {
      toast.error('Save failed')
      return
    }
    const data = await res.json()
    setCards(prev => prev.map(c => (c.id === card.id ? data.item : c)))
    toast.success('Card saved')
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading resources…</p>
  }

  const homeCards = cards.filter(c => c.page_slug === 'home')

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-xl font-bold text-black">Resources Content</h2>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch('/api/admin/resources/seed', { method: 'POST' })
              if (res.ok) {
                toast.success('Defaults seeded to database')
                window.location.reload()
              } else toast.error('Seed failed — run migration 013 first')
            }}
            className="text-xs font-medium text-neutral-500 hover:text-black underline"
          >
            Seed defaults
          </button>
        </div>
        <p className="text-sm text-neutral-500">Edit seller-facing resource pages and home cards.</p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-bold text-black mb-4">Home Cards</h3>
        <div className="space-y-4">
          {homeCards.map(card => (
            <div key={card.id} className="grid gap-3 sm:grid-cols-2 border-b border-neutral-100 pb-4 last:border-0">
              <label className="block">
                <span className="text-xs text-neutral-400">Title</span>
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  defaultValue={card.title}
                  onBlur={e => saveCard(card, { title: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-400">Subtitle</span>
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  defaultValue={card.subtitle ?? ''}
                  onBlur={e => saveCard(card, { subtitle: e.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-neutral-400">Description</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  rows={2}
                  defaultValue={card.description ?? ''}
                  onBlur={e => saveCard(card, { description: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-400">CTA Text</span>
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  defaultValue={card.cta_text ?? ''}
                  onBlur={e => saveCard(card, { cta_text: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-400">CTA URL</span>
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  defaultValue={card.cta_url ?? ''}
                  onBlur={e => saveCard(card, { cta_url: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {pages.map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setSelectedPage(p.slug)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedPage === p.slug ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        {page && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-neutral-400">Title</span>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                defaultValue={page.title}
                onBlur={e => savePage({ title: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-400">Subtitle</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                rows={2}
                defaultValue={page.subtitle ?? ''}
                onBlur={e => savePage({ subtitle: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-400">Content JSON (blocks)</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs font-mono"
                rows={12}
                defaultValue={JSON.stringify(page.content_json, null, 2)}
                onBlur={e => {
                  try {
                    const content_json = JSON.parse(e.target.value)
                    savePage({ content_json })
                  } catch {
                    toast.error('Invalid JSON')
                  }
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={page.is_published}
                onChange={e => savePage({ is_published: e.target.checked })}
              />
              Published
            </label>
          </div>
        )}
      </section>
    </div>
  )
}
