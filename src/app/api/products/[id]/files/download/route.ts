import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { DOWNLOAD_URL_EXPIRY_SECONDS } from '@/lib/platform-config'

import { verifyProductManageAccess } from '@/lib/stores/product-access'

async function verifyProductOwnership(productId: string, userId: string) {
  const access = await verifyProductManageAccess(productId, userId)
  if (!access) return null
  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', access.product.store_id)
    .maybeSingle()
  if (!store) return null
  return { product: access.product, store }
}

// GET /api/products/[id]/files/download?fileId=xxx — seller preview/download
export async function GET(
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
  const preview = searchParams.get('preview') === '1'
  if (!fileId) return NextResponse.json({ error: 'fileId required.' }, { status: 400 })

  const admin = getSupabaseAdminClient()
  const { data: file } = await admin
    .from('product_files')
    .select('id, file_name, file_type, storage_path, file_url')
    .eq('id', fileId)
    .eq('product_id', productId)
    .eq('seller_id', user.id)
    .maybeSingle()

  if (file?.file_type === 'link' && file.file_url) {
    return NextResponse.json({
      download_url: file.file_url,
      file_name: file.file_name,
      file_type: file.file_type,
      is_link: true,
    })
  }

  if (!file?.storage_path) {
    return NextResponse.json({ error: 'File not available.' }, { status: 404 })
  }

  const signedUrlOptions = preview ? undefined : { download: file.file_name }
  const { data: signedData, error: signedErr } = await admin.storage
    .from('product-files')
    .createSignedUrl(file.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS, signedUrlOptions)

  if (signedErr || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })
  }

  return NextResponse.json({
    download_url: signedData.signedUrl,
    file_name: file.file_name,
    file_type: file.file_type,
  })
}
