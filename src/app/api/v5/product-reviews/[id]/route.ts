import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser } from '@/lib/supabase/v5-helpers'

type Ctx = { params: Promise<{ id: string }> }

// PATCH /api/v5/product-reviews/[id] — toggle approved or update
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
    customerName: string
    customerEmail: string | null
    rating: number
    message: string
    approved: boolean
  }>

  type ReviewUpdate = {
    customer_name?: string
    customer_email?: string | null
    rating?: number
    message?: string
    approved?: boolean
  }
  const updatePayload: ReviewUpdate = {}
  if (body.customerName !== undefined) updatePayload.customer_name = body.customerName
  if (body.customerEmail !== undefined) updatePayload.customer_email = body.customerEmail
  if (body.rating !== undefined) updatePayload.rating = Math.min(5, Math.max(1, body.rating))
  if (body.message !== undefined) updatePayload.message = body.message
  if (body.approved !== undefined) updatePayload.approved = body.approved

  const { data, error } = await admin
    .from('product_reviews')
    .update(updatePayload)
    .eq('id', id)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[V5 product-reviews PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data, persisted: true })
}

// DELETE /api/v5/product-reviews/[id]
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
    .from('product_reviews')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    console.error('[V5 product-reviews DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, persisted: true })
}
