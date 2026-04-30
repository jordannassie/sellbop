import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser } from '@/lib/supabase/v5-helpers'
import type { Database } from '@/lib/supabase/types'

type StoreUpdate = Database['public']['Tables']['stores']['Update']

// PATCH /api/v5/store-banner — update banner_url and layout_mode for auth user's store
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const body = (await req.json()) as {
    bannerUrl?: string | null
    layoutMode?: string
  }

  // Find the user's store
  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!store) {
    return NextResponse.json({ error: 'No store found for this user.' }, { status: 404 })
  }

  const updatePayload: StoreUpdate = { updated_at: new Date().toISOString() }
  if (body.bannerUrl !== undefined) updatePayload.banner_url = body.bannerUrl ?? null
  if (body.layoutMode !== undefined) updatePayload.layout_mode = body.layoutMode

  const { data, error } = await admin
    .from('stores')
    .update(updatePayload)
    .eq('id', store.id)
    .select('id, banner_url, layout_mode')
    .single()

  if (error) {
    console.error('[V5 store-banner PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ store: data, persisted: true })
}

// GET /api/v5/store-banner?slug=<storeSlug> — public read of banner for a store
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ banner: null })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ banner: null, fallback: true })

  const { data: store } = await admin
    .from('stores')
    .select('banner_url, layout_mode')
    .eq('slug', slug)
    .maybeSingle()

  if (!store) return NextResponse.json({ banner: null })

  return NextResponse.json({
    banner: {
      bannerUrl: store.banner_url ?? null,
      layoutMode: store.layout_mode ?? 'clean',
    },
  })
}
