'use client'

import { useCallback, useEffect, useState } from 'react'
import { Lightbulb, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/product-categories'
import type { GoogleTrendItem, ProductIdea } from '@/lib/product-ideas/types'
import { useUserStore } from '@/hooks/use-user-store'
import { toast } from 'sonner'
import {
  CATEGORY_OPTIONS,
  COUNT_OPTIONS,
  EXAMPLE_CATEGORY_CHIPS,
  ProductIdeaCard,
  ProductIdeasLoading,
} from '@/components/dashboard/product-ideas/product-idea-card'

type Tab = 'find' | 'saved'

export function ProductIdeasClient() {
  const { activeStoreId } = useUserStore()
  const [tab, setTab] = useState<Tab>('find')
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0])
  const [count, setCount] = useState<'5' | '10' | '15'>('5')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ProductIdea[]>([])
  const [trendingNow, setTrendingNow] = useState<GoogleTrendItem[]>([])
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState<ProductIdea[]>([])
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [loadingSaved, setLoadingSaved] = useState(false)

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true)
    try {
      const res = await fetch('/api/product-ideas/saved', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load saved ideas.')
      setSaved(data.ideas ?? [])
      setSavedTitles(new Set((data.ideas ?? []).map((i: ProductIdea) => i.title)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load saved ideas.')
    } finally {
      setLoadingSaved(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'saved') void loadSaved()
  }, [tab, loadSaved])

  async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
    const contentType = res.headers.get('content-type') ?? ''
    const text = await res.text()

    if (!contentType.includes('application/json')) {
      throw new Error('Product research couldn\'t complete. Please try again.')
    }

    try {
      return JSON.parse(text) as Record<string, unknown>
    } catch {
      throw new Error('Product research couldn\'t complete. Please try again.')
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setResults([])
    setTrendingNow([])
    setResultMessage(null)
    try {
      const res = await fetch('/api/product-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          category,
          count: Number(count),
        }),
      })
      const data = await parseApiJson(res)

      if (data.ok === false) {
        const err = data.error as { message?: string } | undefined
        throw new Error(err?.message ?? 'Product research couldn\'t complete. Please try again.')
      }

      if (!res.ok) {
        throw new Error(String(data.error ?? 'Product research couldn\'t complete. Please try again.'))
      }

      setResults((data.ideas as ProductIdea[]) ?? [])
      setTrendingNow((data.trendingNow as GoogleTrendItem[]) ?? [])
      setResultMessage(data.message != null ? String(data.message) : null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Product research couldn\'t complete. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(idea: ProductIdea) {
    setSavingId(idea.id)
    try {
      const res = await fetch('/api/product-ideas/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, idea }),
      })
      const data = await res.json()
      if (res.status === 409) {
        toast.message('Already saved.')
        setSavedTitles(prev => new Set(prev).add(idea.title))
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Could not save idea.')
      setSavedTitles(prev => new Set(prev).add(idea.title))
      toast.success('Idea saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save idea.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    try {
      const res = await fetch(`/api/product-ideas/saved/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not remove idea.')
      setSaved(prev => prev.filter(i => i.id !== id))
      toast.success('Idea removed.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove idea.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Lightbulb size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">Product Ideas</h1>
        </div>
        <p className="text-sm font-medium text-neutral-700 ml-[52px]">Find what people are searching for now.</p>
        <p className="text-sm text-neutral-500 mt-1 ml-[52px] max-w-2xl">
          SellBop scans Google Trends for rising interest and turns useful opportunities into digital products you can build with AI.
        </p>
        <p className="text-xs text-neutral-400 mt-2 ml-[52px] max-w-2xl">
          Not every trend makes a good product. SellBop filters for problems with real product potential.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['find', 'saved'] as const).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            )}
          >
            {key === 'find' ? 'Find Ideas' : 'Saved'}
          </button>
        ))}
      </div>

      {tab === 'find' && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Research a product opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <Input
                  label="What do you know or want to sell?"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="meal planning for busy parents"
                />
                <Select
                  label="Category"
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  options={CATEGORY_OPTIONS}
                  required
                />
                <Select
                  label="Number of ideas"
                  value={count}
                  onChange={e => setCount(e.target.value as '5' | '10' | '15')}
                  options={COUNT_OPTIONS}
                />
                <Button type="submit" loading={loading} disabled={loading} className="font-semibold">
                  <Sparkles size={14} className="mr-1 text-emerald-400" />
                  Find Product Ideas
                </Button>
              </form>
            </CardContent>
          </Card>

          {!loading && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
              <h2 className="text-lg font-bold text-black mb-2">Find what people are searching for now.</h2>
              <p className="text-sm text-neutral-600 max-w-lg mx-auto mb-6">
                Start with a category or optional topic. SellBop checks Google Trends Trending Now and turns useful demand signals into digital-product ideas.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_CATEGORY_CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setCategory(chip.category)}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400 transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <ProductIdeasLoading />}

          {!loading && results.length > 0 && (
            <div>
              {trendingNow.length > 0 && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-black mb-2">Trending Now</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingNow.map(trend => (
                      <button
                        key={trend.query}
                        type="button"
                        onClick={() => setTopic(trend.query)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 hover:border-neutral-400 transition-colors"
                      >
                        {trend.query}
                        {trend.trafficLabel ? ` · ${trend.trafficLabel}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-black">Product Opportunities</h2>
                <p className="text-sm text-neutral-500">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                {resultMessage && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                    {resultMessage}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {results.map(idea => (
                  <ProductIdeaCard
                    key={idea.id}
                    idea={idea}
                    onSave={() => void handleSave(idea)}
                    saving={savingId === idea.id}
                    saved={savedTitles.has(idea.title)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {loadingSaved ? (
            <ProductIdeasLoading />
          ) : saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
              <p className="text-sm text-neutral-600">No saved ideas yet. Research opportunities and bookmark the ones you like.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {saved.map(idea => (
                <ProductIdeaCard
                  key={idea.id}
                  idea={idea}
                  onRemove={() => void handleRemove(idea.id)}
                  removing={removingId === idea.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
