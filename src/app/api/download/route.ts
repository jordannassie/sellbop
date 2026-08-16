import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { DOWNLOAD_URL_EXPIRY_SECONDS } from '@/lib/platform-config'

// GET /api/download?orderId=xxx&productId=xxx&email=xxx
// Secure download endpoint — verifies purchase entitlement then generates signed URL
export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const productId = searchParams.get('productId')
  const email = searchParams.get('email')?.toLowerCase()

  if (!orderId || !productId || !email) {
    return NextResponse.json(
      { error: 'orderId, productId, and email are required.' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdminClient()

  // Verify purchase entitlement
  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, file_id')
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .eq('buyer_email', email)
    .eq('status', 'active')
    .maybeSingle()

  if (!purchase) {
    return NextResponse.json({ error: 'No valid purchase found for this email.' }, { status: 403 })
  }

  // Get the product file
  let fileQuery = admin
    .from('product_files')
    .select('id, file_name, storage_path, file_type')
    .eq('product_id', productId)

  if (purchase.file_id) {
    fileQuery = fileQuery.eq('id', purchase.file_id)
  }

  const { data: files } = await fileQuery.order('sort_order', { ascending: true })
  const file = files?.[0]

  if (!file?.storage_path) {
    return NextResponse.json({ error: 'No file available for this product.' }, { status: 404 })
  }

  // Generate signed URL (expires in DOWNLOAD_URL_EXPIRY_SECONDS)
  const { data: signedData, error: signedErr } = await admin.storage
    .from('product-files')
    .createSignedUrl(file.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS, {
      download: file.file_name,
    })

  if (signedErr || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })
  }

  return NextResponse.json({
    download_url: signedData.signedUrl,
    file_name: file.file_name,
    expires_in: DOWNLOAD_URL_EXPIRY_SECONDS,
  })
}
