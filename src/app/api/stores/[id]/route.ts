import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { userCanAccessStore } from '@/lib/stores/active-store'

// GET /api/stores/[id] — full store row for an accessible shop
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const canAccess = await userCanAccessStore(user.id, id)
  if (!canAccess) {
    return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
  }

  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !store) {
    return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
  }

  return NextResponse.json({ store })
}
