import type { SchoolLesson } from './types'

/** Featured lesson on the marketing homepage School section. */
export const HOME_SCHOOL_LESSON: Pick<
  SchoolLesson,
  'id' | 'title' | 'original_video_title' | 'creator' | 'youtube_video_id'
> = {
  id: 'power-of-one-great-product',
  title: 'The Power of One Great Product',
  original_video_title: 'How 1 Digital Product Made Me $141M (And How You Can Do It Too)',
  creator: 'Tanner Chidester',
  youtube_video_id: 'dHpIKpEP9IA',
}
