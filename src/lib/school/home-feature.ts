import type { SchoolCategory, SchoolLesson } from './types'
import { youtubeWatchUrl } from './utils'

/** Featured lesson on the marketing homepage School section. */
export const HOME_SCHOOL_LESSON: Pick<
  SchoolLesson,
  'id' | 'title' | 'original_video_title' | 'creator' | 'youtube_video_id'
> = {
  id: 'recreate-winning-product-with-ai',
  title: 'Recreate a Winning Product With AI',
  original_video_title:
    '$354,000 from ONE Digital Product??? Watch me Recreate it with AI in Minutes!',
  creator: 'Make Money with Stacy La',
  youtube_video_id: 'ju7zG9bdhv4',
}

export const HOME_SCHOOL_LESSON_FULL: SchoolLesson = {
  id: HOME_SCHOOL_LESSON.id,
  title: HOME_SCHOOL_LESSON.title,
  original_video_title: HOME_SCHOOL_LESSON.original_video_title,
  creator: HOME_SCHOOL_LESSON.creator,
  youtube_url: youtubeWatchUrl(HOME_SCHOOL_LESSON.youtube_video_id),
  youtube_video_id: HOME_SCHOOL_LESSON.youtube_video_id,
  thumbnail_url: null,
  duration: '15 min',
  categories: ['create-it', 'ai', 'sell-it'] satisfies SchoolCategory[],
  description:
    'Watch a real high-performing digital product get recreated step by step using AI — from research to a sellable offer.',
  why_recommend:
    'Stacy La breaks down a product that generated hundreds of thousands in sales and shows how modern AI tools can speed up the creation process.',
  featured: false,
  sort_order: 10,
  published: true,
  section_id: 'create-it',
}
