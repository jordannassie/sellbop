import type { SchoolCategory, SchoolLesson } from './types'

export const SCHOOL_CATEGORY_FILTERS: { label: string; value: SchoolCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Start Here', value: 'start-here' },
  { label: 'Find Your Product', value: 'find-product' },
  { label: 'Create It', value: 'create-it' },
  { label: 'Sell It', value: 'sell-it' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'AI', value: 'ai' },
  { label: 'Affiliate Selling', value: 'affiliate-selling' },
]

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function normalizeLesson(lesson: SchoolLesson): SchoolLesson {
  return {
    ...lesson,
    thumbnail_url: lesson.thumbnail_url ?? youtubeThumbnail(lesson.youtube_video_id),
    youtube_url: lesson.youtube_url || youtubeWatchUrl(lesson.youtube_video_id),
  }
}

export function filterLessons(
  lessons: SchoolLesson[],
  options: { query?: string; category?: SchoolCategory | 'all' },
): SchoolLesson[] {
  const q = options.query?.trim().toLowerCase()
  const category = options.category ?? 'all'

  return lessons.filter(lesson => {
    if (!lesson.published) return false
    if (category !== 'all' && !lesson.categories.includes(category)) return false
    if (!q) return true

    const haystack = [
      lesson.title,
      lesson.original_video_title,
      lesson.creator,
      ...lesson.categories,
      lesson.description,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

export function getAdjacentLessons(lessons: SchoolLesson[], currentId: string) {
  const ordered = [...lessons]
    .filter(l => l.published)
    .sort((a, b) => a.sort_order - b.sort_order)
  const index = ordered.findIndex(l => l.id === currentId)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  }
}
