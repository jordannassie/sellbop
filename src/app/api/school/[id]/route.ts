import { NextResponse } from 'next/server'
import { fetchSchoolLesson, fetchSchoolLessons } from '@/lib/school/fetch'
import { getAdjacentLessons } from '@/lib/school/utils'

// GET /api/school/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const lesson = await fetchSchoolLesson(id)
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
  }

  const all = await fetchSchoolLessons()
  const { prev, next } = getAdjacentLessons(all, id)

  return NextResponse.json({ lesson, prev, next })
}
