import { NextResponse } from 'next/server'
import { getAllowedAdminEmails, isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { fetchAllResourceCards, fetchAllResourcePages } from '@/lib/resources/fetch'

async function assertAdminApi() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !getAllowedAdminEmails().includes(user.email.toLowerCase())) {
    return null
  }
  return user
}

export async function GET() {
  if (!(await assertAdminApi())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ pages: [], cards: [] })
  }

  const [pages, cards] = await Promise.all([
    fetchAllResourcePages(),
    fetchAllResourceCards(),
  ])

  return NextResponse.json({ pages, cards })
}

export async function PATCH(request: Request) {
  if (!(await assertAdminApi())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await request.json() as {
    type: 'page' | 'card'
    id: string
    patch: Record<string, unknown>
  }

  const admin = getSupabaseAdminClient()
  const table = body.type === 'page' ? 'resource_pages' : 'resource_cards'

  const { data, error } = await admin
    .from(table)
    .update({ ...body.patch, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

export async function POST(request: Request) {
  if (!(await assertAdminApi())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await request.json() as {
    type: 'page' | 'card'
    item: Record<string, unknown>
  }

  const admin = getSupabaseAdminClient()
  const table = body.type === 'page' ? 'resource_pages' : 'resource_cards'

  const { data, error } = await admin
    .from(table)
    .insert(body.item as never)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}
