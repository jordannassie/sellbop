import type { SchoolLesson } from './types'

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
