import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'

async function verifyProductOwnership(productId: string, userId: string) {
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('id, store_id')
    .eq('id', productId)
    .maybeSingle()
  if (!product) return null

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store || store.owner_user_id !== userId) return null
  return { product, store }
}

// POST /api/products/[id]/files — register an uploaded file record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const body = await request.json()
  const { file_name, file_type, file_size, storage_path } = body

  if (!file_name || !storage_path) {
    return NextResponse.json({ error: 'file_name and storage_path are required.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data: file, error } = await admin
    .from('product_files')
    .insert({
      product_id: productId,
      seller_id: user.id,
      file_name,
      file_url: '',
      file_type: file_type ?? 'application/octet-stream',
      file_size: file_size ?? null,
      storage_path,
      upload_status: 'complete',
      visibility: 'buyers',
      sort_order: 0,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ file }, { status: 201 })
}

// DELETE /api/products/[id]/files — delete a file record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: productId } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const ownership = await verifyProductOwnership(productId, user.id)
  if (!ownership) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId required.' }, { status: 400 })

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('product_files')
    .delete()
    .eq('id', fileId)
    .eq('product_id', productId)
    .eq('seller_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
