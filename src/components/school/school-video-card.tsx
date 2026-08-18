'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { SchoolLesson } from '@/lib/school/types'
import { SaveLessonButton } from './save-lesson-button'
import { YoutubeIcon } from './youtube-embed'

interface SchoolVideoCardProps {
  lesson: SchoolLesson
}

export function SchoolVideoCard({ lesson }: SchoolVideoCardProps) {
  return (
    <Link
      href={`/school/${lesson.id}`}
      className="group flex w-[240px] shrink-0 flex-col sm:w-[260px] lg:w-[280px]"
    >
      <div className="relative mb-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lesson.thumbnail_url ?? `https://i.ytimg.com/vi/${lesson.youtube_video_id}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        {lesson.duration && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Clock size={10} />
            {lesson.duration}
          </span>
        )}
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <SaveLessonButton lessonId={lesson.id} variant="icon" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-black transition-colors">
        {lesson.title}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
        <YoutubeIcon className="text-red-600" />
        <span className="truncate">{lesson.creator}</span>
      </p>
    </Link>
  )
}

interface SchoolVideoRowProps {
  lessons: SchoolLesson[]
}

export function SchoolVideoRow({ lessons }: SchoolVideoRowProps) {
  if (!lessons.length) return null

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {lessons.map(lesson => (
          <div key={lesson.id} className="snap-start">
            <SchoolVideoCard lesson={lesson} />
          </div>
        ))}
      </div>
    </div>
  )
}
