import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getPartnershipMapForStores } from '@/lib/partnerships/queries'
import { getAccessibleStoresForUser, resolveActiveStoreForUser } from '@/lib/stores/active-store'
import { createStoreForUser, CreateStoreError } from '@/lib/stores/create-store'

// GET /api/stores — list accessible shops + active shop id
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const stores = await getAccessibleStoresForUser(user.id)
  const active = await resolveActiveStoreForUser(user.id)
  const partnershipMap = await getPartnershipMapForStores(stores.map(s => s.id))

  return NextResponse.json({
    stores: stores.map(s => {
      const partnership = partnershipMap.get(s.id)
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        avatar_url: s.avatar_url,
        banner_url: s.banner_url,
        owner_user_id: s.owner_user_id,
        role: s.role,
        isPartnerShop: !!partnership,
        partnershipStatus: partnership?.status ?? null,
        isOwnedShop: s.owner_user_id === user.id,
      }
    }),
    activeStoreId: active?.id ?? null,
  })
}

// POST /api/stores — create a new shop
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { name?: string; slug?: string }
  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Shop name is required.' }, { status: 400 })
  }

  try {
    const { store } = await createStoreForUser(user.id, {
      name,
      slug: body.slug?.trim(),
      avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      supportEmail: user.email ?? null,
    })

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
    }, { status: 201 })
  } catch (err) {
    if (err instanceof CreateStoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
