import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'
import { DEFAULT_STORE_BANNER_URL } from '@/lib/store-defaults'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const admin = getSupabaseAdminClient()
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

  // If they already have a store, just return it
  const existingStore = await admin
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (existingStore.error) {
    return NextResponse.json({ error: existingStore.error.message }, { status: 500 })
  }

  if (existingStore.data) {
    return NextResponse.json({ ok: true, storeId: existingStore.data.id })
  }

  // Check slug availability
  const slugCheck = await admin
    .from('stores')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (slugCheck.error) {
    return NextResponse.json({ error: slugCheck.error.message }, { status: 500 })
  }

  if (slugCheck.data) {
    return NextResponse.json({ error: 'That store URL is already taken. Try a different one.' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('stores')
    .insert({
      owner_user_id: user.id,
      slug,
      name,
      banner_url: DEFAULT_STORE_BANNER_URL,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, storeId: data.id })
}
