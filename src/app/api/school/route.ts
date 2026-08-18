import { NextResponse } from 'next/server'
import { fetchSchoolLessons } from '@/lib/school/fetch'
import { filterLessons } from '@/lib/school/utils'
import type { SchoolCategory } from '@/lib/school/types'

// GET /api/school?q=&category=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const category = (searchParams.get('category') as SchoolCategory | 'all' | null) ?? 'all'

  const lessons = await fetchSchoolLessons()
  const filtered = filterLessons(lessons, { query, category })
  const featured = lessons.find(l => l.featured && l.published) ?? lessons[0] ?? null

  return NextResponse.json({ lessons: filtered, featured, total: filtered.length })
}
