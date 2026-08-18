'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, BadgeCheck } from 'lucide-react'
import type { SchoolLesson } from '@/lib/school/types'
import { Button } from '@/components/ui/button'
import { SaveLessonButton } from './save-lesson-button'
import { YoutubeEmbed, YoutubeIcon, YoutubeThumbnail } from './youtube-embed'

interface SchoolHeroProps {
  lesson: SchoolLesson
}

export function SchoolHero({ lesson }: SchoolHeroProps) {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)

  return (
    <section className="mb-10 lg:mb-12">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:items-start">
        {/* Video — first on mobile */}
        <div className="order-1 lg:order-none">
          {playing ? (
            <YoutubeEmbed videoId={lesson.youtube_video_id} title={lesson.title} />
          ) : (
            <YoutubeThumbnail
              videoId={lesson.youtube_video_id}
              title={lesson.title}
              thumbnailUrl={lesson.thumbnail_url}
              onClick={() => setPlaying(true)}
              className="shadow-sm"
            />
          )}
        </div>

        {/* Featured info */}
        <div className="order-2 lg:order-none flex flex-col">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Featured Lesson
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-4">
            {lesson.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-5 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800">
              {lesson.creator}
              <BadgeCheck size={14} className="text-emerald-600" />
            </span>
            <span className="inline-flex items-center gap-1 text-neutral-500">
              <YoutubeIcon className="text-red-600" />
              YouTube
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              Beginner
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Free
            </span>
          </div>

          <p className="text-xs text-neutral-400 mb-5 line-clamp-2">
            Original: &ldquo;{lesson.original_video_title}&rdquo;
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            <Button
              type="button"
              onClick={() => {
                setPlaying(true)
                router.push(`/school/${lesson.id}`)
              }}
            >
              <Play size={14} /> Watch Lesson
            </Button>
            <SaveLessonButton lessonId={lesson.id} />
            <Link
              href={lesson.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors px-2"
            >
              <YoutubeIcon className="text-red-600" />
              On YouTube
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
