import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { fetchSavedLessonIds } from '@/lib/school/fetch'

async function getUserId() {
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  return user?.id ?? null
}

// GET /api/school/my-list
export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const lessonIds = await fetchSavedLessonIds(userId)
  return NextResponse.json({ lessonIds })
}

// POST /api/school/my-list — body: { lessonId }
export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const lessonId = typeof body.lessonId === 'string' ? body.lessonId : null
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('school_saved_lessons')
    .upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' })

  if (error) {
    return NextResponse.json({ error: 'Could not save lesson.' }, { status: 500 })
  }

  return NextResponse.json({ saved: true, lessonId })
}

// DELETE /api/school/my-list?lessonId=xxx
export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const lessonId = new URL(request.url).searchParams.get('lessonId')
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('school_saved_lessons')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)

  if (error) {
    return NextResponse.json({ error: 'Could not remove lesson.' }, { status: 500 })
  }

  return NextResponse.json({ saved: false, lessonId })
}
