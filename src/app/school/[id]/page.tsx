'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { PublicHeader } from '@/components/marketing/public-header'
import { YoutubeEmbed, YoutubeAttribution, YoutubeIcon } from '@/components/school/youtube-embed'
import { SaveLessonButton } from '@/components/school/save-lesson-button'
import { Button } from '@/components/ui/button'
import type { SchoolLesson } from '@/lib/school/types'

export default function SchoolLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [lesson, setLesson] = useState<SchoolLesson | null>(null)
  const [prev, setPrev] = useState<SchoolLesson | null>(null)
  const [next, setNext] = useState<SchoolLesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setLessonId(id))
  }, [params])

  useEffect(() => {
    if (!lessonId) return

    setLoading(true)
    fetch(`/api/school/${lessonId}`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        setLesson(data.lesson)
        setPrev(data.prev ?? null)
        setNext(data.next ?? null)
      })
      .catch(() => router.push('/school'))
      .finally(() => setLoading(false))
  }, [lessonId, router])

  if (loading || !lesson) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <PublicHeader activeHref="/school" ctaMode="school" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="aspect-video animate-pulse rounded-2xl bg-neutral-200 mb-6" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200 mb-3" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader activeHref="/school" ctaMode="school" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          href="/school"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-5"
        >
          <ArrowLeft size={14} /> Back to School
        </Link>

        {/* Video first — especially on mobile */}
        <YoutubeEmbed
          videoId={lesson.youtube_video_id}
          title={lesson.title}
          className="mb-6 shadow-sm"
        />

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
            SellBop School Lesson
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-3">
            {lesson.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800">
              <YoutubeIcon className="text-red-600" />
              {lesson.creator}
            </span>
            {lesson.duration && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                {lesson.duration}
              </span>
            )}
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Free
            </span>
          </div>

          <YoutubeAttribution creator={lesson.creator} videoTitle={lesson.original_video_title} />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 mb-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-black mb-1">About this lesson</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{lesson.description}</p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-black mb-1">Why we recommend it</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{lesson.why_recommend}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <SaveLessonButton lessonId={lesson.id} />
          <Link href={lesson.youtube_url} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" size="sm">
              <ExternalLink size={13} /> Watch on YouTube
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 border-t border-neutral-200 pt-6">
          {prev ? (
            <Link
              href={`/school/${prev.id}`}
              className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors"
            >
              <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                <ArrowLeft size={12} /> Previous
              </p>
              <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{prev.title}</p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/school/${next.id}`}
              className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors text-right"
            >
              <p className="text-xs text-neutral-400 mb-1 flex items-center justify-end gap-1">
                Next <ArrowRight size={12} />
              </p>
              <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{next.title}</p>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
