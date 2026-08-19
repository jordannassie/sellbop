'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HOME_SCHOOL_LESSON } from '@/lib/school/home-feature'

export function HomeSchoolSection() {
  const lesson = HOME_SCHOOL_LESSON

  return (
    <section className="border-t border-neutral-100 py-20 sm:py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: '#00E676' }}
            >
              <GraduationCap size={14} />
              SellBop School
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-[1.08] mb-4">
              Learn how to build and sell digital products.
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
              Free curated YouTube lessons from creators who have built real digital product businesses — product ideas, AI workflows, marketing, and more.
            </p>
            <p className="text-sm font-semibold text-black mb-6">{lesson.title}</p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Link href="/school">
                <Button size="lg">
                  Join School <ArrowRight size={16} />
                </Button>
              </Link>
              <Link
                href={`/school/${lesson.id}`}
                className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
              >
                Watch this lesson →
              </Link>
            </div>
          </div>

          <Link
            href={`/school/${lesson.id}`}
            className="group relative block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 aspect-video shadow-sm"
            aria-label={`Watch ${lesson.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${lesson.youtube_video_id}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg sm:h-16 sm:w-16">
                <span className="ml-1 block h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black sm:border-y-[12px] sm:border-l-[18px]" />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
