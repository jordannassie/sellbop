import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { DEFAULT_SCHOOL_LESSONS, getFeaturedLesson, getLessonById } from './defaults'
import type { SchoolLesson, SchoolLessonRow } from './types'
import { normalizeLesson } from './utils'

function mapRow(row: SchoolLessonRow): SchoolLesson {
  return normalizeLesson({
    id: row.id,
    title: row.title,
    original_video_title: row.original_video_title,
    creator: row.creator,
    youtube_url: row.youtube_url,
    youtube_video_id: row.youtube_video_id,
    thumbnail_url: row.thumbnail_url,
    duration: row.duration,
    categories: row.categories,
    description: row.description,
    why_recommend: row.why_recommend,
    featured: row.featured,
    sort_order: row.sort_order,
    published: row.published,
    section_id: row.section_id,
  })
}

export async function fetchSchoolLessons(): Promise<SchoolLesson[]> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_SCHOOL_LESSONS
  }

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('school_lessons')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })

    if (error || !data?.length) {
      return DEFAULT_SCHOOL_LESSONS
    }

    return (data as SchoolLessonRow[]).map(mapRow)
  } catch {
    return DEFAULT_SCHOOL_LESSONS
  }
}

export async function fetchSchoolLesson(id: string): Promise<SchoolLesson | null> {
  const lessons = await fetchSchoolLessons()
  return getLessonById(id, lessons) ?? null
}

export async function fetchFeaturedSchoolLesson(): Promise<SchoolLesson> {
  const lessons = await fetchSchoolLessons()
  return getFeaturedLesson(lessons)
}

export async function fetchSavedLessonIds(userId: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return []

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('school_saved_lessons')
      .select('lesson_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(row => row.lesson_id)
  } catch {
    return []
  }
}
