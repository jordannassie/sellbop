import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser } from '@/lib/supabase/v5-helpers'

type Ctx = { params: Promise<{ id: string }> }

// PATCH /api/v5/product-updates/[id] — toggle status or update fields
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  if (id.startsWith('local-')) {
    return NextResponse.json({ updated: true, persisted: false })
  }

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const body = (await req.json()) as Partial<{
    title: string
    body: string
    linkUrl: string | null
    linkLabel: string | null
    status: 'draft' | 'published'
  }>

  type UpdatePayload = {
    title?: string
    body?: string
    link_url?: string | null
    link_label?: string | null
    status?: string
    updated_at?: string
  }
  const updatePayload: UpdatePayload = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updatePayload.title = body.title
  if (body.body !== undefined) updatePayload.body = body.body
  if (body.linkUrl !== undefined) updatePayload.link_url = body.linkUrl
  if (body.linkLabel !== undefined) updatePayload.link_label = body.linkLabel
  if (body.status !== undefined) updatePayload.status = body.status

  const { data, error } = await admin
    .from('product_updates')
    .update(updatePayload)
    .eq('id', id)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[V5 product-updates PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ update: data, persisted: true })
}

// DELETE /api/v5/product-updates/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  if (id.startsWith('local-')) {
    return NextResponse.json({ deleted: true, persisted: false })
  }

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { error } = await admin
    .from('product_updates')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    console.error('[V5 product-updates DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, persisted: true })
}
