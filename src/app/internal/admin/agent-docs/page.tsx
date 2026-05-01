'use client'
/**
 * Admin Agent Knowledge docs page.
 * Phase 1: docs are stored in localStorage.
 * Phase 2: will sync to Supabase.
 */
import { useEffect, useState } from 'react'
import { BookOpen, Check, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_AGENT_KNOWLEDGE_DOCS, type AgentKnowledgeDoc } from '@/lib/demo-data/agent-knowledge'
import { saveAgentKnowledgeDocs, loadAgentKnowledgeDocs } from '@/lib/agent/agent-knowledge'

const CATEGORY_COLORS: Record<string, string> = {
  framework: 'bg-blue-100 text-blue-700',
  journey:   'bg-purple-100 text-purple-700',
  rules:     'bg-red-100 text-red-700',
  products:  'bg-green-100 text-green-700',
  credits:   'bg-amber-100 text-amber-700',
  voice:     'bg-pink-100 text-pink-700',
}

function categoryClass(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-neutral-100 text-neutral-600'
}

export default function AgentDocsPage() {
  const [docs, setDocs] = useState<AgentKnowledgeDoc[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadAgentKnowledgeDocs()
    setDocs(loaded)
    if (loaded.length > 0) setSelectedId(loaded[0].id)
  }, [])

  const selected = docs.find(d => d.id === selectedId) ?? null

  function updateSelected(patch: Partial<AgentKnowledgeDoc>) {
    setDocs(prev =>
      prev.map(d => (d.id === selectedId ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
    )
    setDirty(true)
    setSaved(false)
  }

  function handleSave() {
    saveAgentKnowledgeDocs(docs)
    setDirty(false)
    setSaved(true)
    toast.success('Knowledge docs saved locally.')
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    if (!confirm('Reset all docs to defaults? Local edits will be lost.')) return
    const fresh = DEFAULT_AGENT_KNOWLEDGE_DOCS.map(d => ({ ...d, updatedAt: new Date().toISOString() }))
    setDocs(fresh)
    setSelectedId(fresh[0]?.id ?? null)
    saveAgentKnowledgeDocs(fresh)
    setDirty(false)
    toast.success('Reset to defaults.')
  }

  function handleAddDoc() {
    const newDoc: AgentKnowledgeDoc = {
      id: `custom-${Date.now()}`,
      title: 'New Doc',
      category: 'custom',
      content: '',
      active: true,
      updatedAt: new Date().toISOString(),
    }
    setDocs(prev => [...prev, newDoc])
    setSelectedId(newDoc.id)
    setDirty(true)
  }

  function handleDeleteSelected() {
    if (!selectedId) return
    if (!confirm('Delete this doc?')) return
    const next = docs.filter(d => d.id !== selectedId)
    setDocs(next)
    setSelectedId(next[0]?.id ?? null)
    saveAgentKnowledgeDocs(next)
    setDirty(false)
    toast.success('Doc deleted.')
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-neutral-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-3">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-neutral-400" />
          <p className="text-xs font-medium text-neutral-400">
            Admin <span className="mx-1 text-neutral-300">·</span> Agent Knowledge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Internal
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: doc list ───────────────────────────────────────── */}
        <aside className="flex w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-xs font-semibold text-neutral-700">Knowledge Docs</p>
            <button
              type="button"
              onClick={handleAddDoc}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-black hover:text-black"
              title="Add doc"
            >
              <Plus size={12} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {docs.map(doc => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedId(doc.id)}
                className={[
                  'flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors',
                  selectedId === doc.id ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                ].join(' ')}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-medium ${selectedId === doc.id ? 'text-black' : 'text-neutral-700'}`}>
                    {doc.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${categoryClass(doc.category)}`}>
                      {doc.category}
                    </span>
                    {!doc.active && (
                      <span className="text-[9px] text-neutral-400">inactive</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </nav>
          <div className="border-t border-neutral-100 p-3 space-y-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black"
            >
              <RotateCcw size={12} /> Reset to defaults
            </button>
          </div>
        </aside>

        {/* ── Right: editor ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-black">Agent Knowledge</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Edit the docs that teach the SellBop Agent how to guide users.
              </p>
              <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Saved locally for now. Database sync coming next.
              </p>
            </div>

            {selected ? (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">Title</label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={e => updateSelected({ title: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black focus:border-black focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">Category</label>
                  <input
                    type="text"
                    value={selected.category}
                    onChange={e => updateSelected({ category: e.target.value })}
                    placeholder="e.g. framework, rules, credits"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black focus:border-black focus:outline-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">Content</label>
                  <textarea
                    value={selected.content}
                    onChange={e => updateSelected({ content: e.target.value })}
                    rows={10}
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 focus:border-black focus:outline-none"
                    placeholder="Describe what the agent should know or do…"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Active</p>
                    <p className="text-xs text-neutral-500">Inactive docs are excluded from agent prompts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSelected({ active: !selected.active })}
                    className={[
                      'relative h-5 w-9 rounded-full transition-colors',
                      selected.active ? 'bg-emerald-500' : 'bg-neutral-300',
                    ].join(' ')}
                  >
                    <span className={[
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                      selected.active ? 'left-4.5 translate-x-0' : 'left-0.5',
                    ].join(' ')} />
                  </button>
                </div>

                {/* Last updated */}
                <p className="text-[11px] text-neutral-400">
                  Last updated: {new Date(selected.updatedAt).toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    {saved ? <Check size={14} /> : <Save size={14} />}
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                  {dirty && (
                    <p className="text-xs text-amber-600">You have unsaved changes.</p>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="ml-auto flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen size={32} className="mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-500">Select a doc to edit</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
