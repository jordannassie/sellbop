import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { requireActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'

// GET /api/orders — list the authenticated seller's orders
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()

  let store
  try {
    store = await requireActiveStoreForUser(user.id)
  } catch (err) {
    if (err instanceof ActiveStoreError) return NextResponse.json({ orders: [] })
    throw err
  }

  const { data: orders, error } = await admin
    .from('orders')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: orders ?? [] })
}
