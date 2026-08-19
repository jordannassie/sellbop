import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { switchActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'

// POST /api/stores/active — switch the active shop
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { storeId?: string }
  const storeId = body.storeId?.trim()
  if (!storeId) {
    return NextResponse.json({ error: 'Shop ID is required.' }, { status: 400 })
  }

  try {
    const store = await switchActiveStoreForUser(user.id, storeId)
    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        avatar_url: store.avatar_url,
        banner_url: store.banner_url,
        owner_user_id: store.owner_user_id,
        role: store.role,
      },
      activeStoreId: store.id,
    })
  } catch (err) {
    if (err instanceof ActiveStoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
