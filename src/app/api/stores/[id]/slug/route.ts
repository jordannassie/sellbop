import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { StoreSlugError, updateStoreSlugForUser } from '@/lib/stores/slug-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: { slug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.slug?.trim()) {
    return NextResponse.json({ error: 'Shop URL is required.' }, { status: 400 })
  }

  try {
    const result = await updateStoreSlugForUser(user.id, id, body.slug)
    return NextResponse.json({
      storeId: result.storeId,
      slug: result.slug,
      previousSlug: result.previousSlug,
    })
  } catch (err) {
    if (err instanceof StoreSlugError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[PATCH /api/stores/[id]/slug]', err)
    return NextResponse.json({ error: 'Could not update shop URL.' }, { status: 500 })
  }
}
