'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, X, GraduationCap, ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/marketing/public-header'
import { SchoolHero } from '@/components/school/school-hero'
import { SchoolVideoRow } from '@/components/school/school-video-card'
import { LaunchOnSellbopSection } from '@/components/school/school-native-sections'
import { MyListLink } from '@/components/school/save-lesson-button'
import { SCHOOL_SECTIONS } from '@/lib/school/defaults'
import type { SchoolCategory, SchoolLesson } from '@/lib/school/types'
import { SCHOOL_CATEGORY_FILTERS } from '@/lib/school/utils'
import { useAuth } from '@/context/auth-context'

export default function SchoolPageClient() {
  const { session } = useAuth()
  const searchParams = useSearchParams()
  const myListMode = searchParams.get('myList') === '1'

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<SchoolCategory | 'all'>('all')
  const [lessons, setLessons] = useState<SchoolLesson[]>([])
  const [featured, setFeatured] = useState<SchoolLesson | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const loadLessons = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (!myListMode && query) params.set('q', query)
      if (!myListMode && activeCategory !== 'all') params.set('category', activeCategory)
      const res = await fetch(`/api/school?${params}`)
      const data = await res.json()
      setLessons(data.lessons ?? [])
      setFeatured(data.featured ?? null)
    } catch {
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [query, activeCategory, myListMode])

  useEffect(() => {
    const timer = setTimeout(loadLessons, query ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadLessons, query])

  useEffect(() => {
    if (!session) {
      setSavedIds([])
      return
    }
    fetch('/api/school/my-list')
      .then(r => (r.ok ? r.json() : { lessonIds: [] }))
      .then(data => setSavedIds(data.lessonIds ?? []))
      .catch(() => setSavedIds([]))
  }, [session])

  const displayLessons = useMemo(() => {
    if (!myListMode) return lessons
    return lessons.filter(l => savedIds.includes(l.id))
  }, [lessons, myListMode, savedIds])

  const lessonsById = useMemo(() => {
    const map = new Map<string, SchoolLesson>()
    for (const lesson of displayLessons) map.set(lesson.id, lesson)
    return map
  }, [displayLessons])

  const showHero = !myListMode && !query && activeCategory === 'all' && featured

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader activeHref="/school" ctaMode="school" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Page headline */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={22} className="text-emerald-600" />
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-700">SellBop School</span>
            </div>
            <MyListLink count={savedIds.length} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-2">
            Learn How to Sell Digital Products
          </h1>
          <p className="text-neutral-600 text-base max-w-2xl">
            We find the best digital-product training so you don&apos;t have to. Learn what works, build your product, and start selling with SellBop.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search lessons, creators, topics..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        {!myListMode && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {SCHOOL_CATEGORY_FILTERS.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.value
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {myListMode && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            Showing lessons you saved to My List.
            {!session && (
              <>
                {' '}
                <Link href="/signup" className="font-semibold text-black hover:underline">
                  Sign up free
                </Link>{' '}
                to save lessons.
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        ) : (
          <>
            {showHero && featured && <SchoolHero lesson={featured} />}

            {myListMode && displayLessons.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white py-16 text-center px-6">
                <p className="text-neutral-600 mb-4">No saved lessons yet.</p>
                <Link href="/school" className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:underline">
                  Browse lessons <ArrowRight size={14} />
                </Link>
              </div>
            ) : query || activeCategory !== 'all' ? (
              <section className="mb-12">
                <h2 className="text-xl font-black text-black mb-4">
                  {displayLessons.length} lesson{displayLessons.length !== 1 ? 's' : ''} found
                </h2>
                <SchoolVideoRow lessons={displayLessons} />
              </section>
            ) : (
              !myListMode && (
                <>
                  {SCHOOL_SECTIONS.map(section => {
                    const sectionLessons = section.lessonIds
                      .map(id => lessonsById.get(id))
                      .filter((l): l is SchoolLesson => !!l)
                    if (!sectionLessons.length) return null

                    return (
                      <section key={section.id} className="mb-10">
                        <div className="mb-4">
                          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                            {section.heading}
                          </h2>
                          {section.description && (
                            <p className="text-sm text-neutral-500 mt-1">{section.description}</p>
                          )}
                        </div>
                        <SchoolVideoRow lessons={sectionLessons} />
                      </section>
                    )
                  })}

                  <LaunchOnSellbopSection />
                </>
              )
            )}

            {myListMode && displayLessons.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-black text-black mb-4">My List</h2>
                <SchoolVideoRow lessons={displayLessons} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
