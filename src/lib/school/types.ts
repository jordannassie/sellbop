export type SchoolCategory =
  | 'start-here'
  | 'find-product'
  | 'create-it'
  | 'sell-it'
  | 'marketing'
  | 'ai'
  | 'affiliate-selling'

export interface SchoolLesson {
  id: string
  title: string
  original_video_title: string
  creator: string
  youtube_url: string
  youtube_video_id: string
  thumbnail_url: string | null
  duration: string | null
  categories: SchoolCategory[]
  description: string
  why_recommend: string
  featured: boolean
  sort_order: number
  published: boolean
  section_id: string
}

export interface SchoolLessonRow extends SchoolLesson {
  created_at?: string
  updated_at?: string
}

export interface SchoolSection {
  id: string
  heading: string
  description?: string
  lessonIds: string[]
}
