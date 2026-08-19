import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createStoreForUser, CreateStoreError } from '@/lib/stores/create-store'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { name?: string; slug?: string }
  const name = body.name?.trim()
  const slug = slugify(body.slug?.trim() || body.name?.trim() || '')

  if (!name || !slug) {
    return NextResponse.json({ error: 'Store name and slug are required.' }, { status: 400 })
  }

  try {
    const { store } = await createStoreForUser(user.id, {
      name,
      slug,
      avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      supportEmail: user.email ?? null,
    })

    return NextResponse.json({ ok: true, storeId: store.id })
  } catch (err) {
    if (err instanceof CreateStoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
