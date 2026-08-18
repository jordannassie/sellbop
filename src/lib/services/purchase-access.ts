import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { DOWNLOAD_URL_EXPIRY_SECONDS } from '@/lib/platform-config'

export interface PurchaseAccessFile {
  id: string
  fileName: string
  fileType: string
  isLink: boolean
  downloadPath: string
}

export interface PurchaseAccessDetails {
  purchaseId: string
  orderId: string
  productId: string
  productTitle: string
  productSlug: string | null
  coverImageUrl: string | null
  sellerName: string
  sellerSlug: string | null
  supportEmail: string
  buyerEmail: string
  buyerName: string | null
  amountCents: number
  purchasedAt: string
  status: 'active' | 'revoked' | 'expired'
  accessToken: string
  files: PurchaseAccessFile[]
}

export function getPurchaseAccessUrl(accessToken: string): string {
  return `${env.app.url}/access/${accessToken}`
}

export async function getPurchaseByAccessToken(token: string): Promise<PurchaseAccessDetails | null> {
  const admin = getSupabaseAdminClient()

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, order_id, product_id, buyer_email, status, created_at, access_token')
    .eq('access_token', token)
    .maybeSingle()

  if (!purchase?.access_token) return null

  const [{ data: order }, { data: product }] = await Promise.all([
    admin.from('orders').select('id, buyer_name, total_cents').eq('id', purchase.order_id).maybeSingle(),
    admin.from('products').select('id, title, slug, cover_image_url, image_url, store_id').eq('id', purchase.product_id).maybeSingle(),
  ])

  if (!order || !product) return null

  const { data: store } = await admin
    .from('stores')
    .select('name, slug, support_email')
    .eq('id', product.store_id)
    .maybeSingle()

  const { data: files } = await admin
    .from('product_files')
    .select('id, file_name, file_type, file_url, storage_path, sort_order')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  return {
    purchaseId: purchase.id,
    orderId: purchase.order_id,
    productId: purchase.product_id,
    productTitle: product.title,
    productSlug: product.slug,
    coverImageUrl: product.cover_image_url ?? product.image_url,
    sellerName: store?.name ?? 'Seller',
    sellerSlug: store?.slug ?? null,
    supportEmail: store?.support_email ?? env.email.supportEmail,
    buyerEmail: purchase.buyer_email,
    buyerName: order.buyer_name,
    amountCents: order.total_cents ?? 0,
    purchasedAt: purchase.created_at,
    status: (purchase.status ?? 'active') as PurchaseAccessDetails['status'],
    accessToken: purchase.access_token,
    files: (files ?? []).map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      isLink: file.file_type === 'link',
      downloadPath: `/api/access/${purchase.access_token}/files/${file.id}`,
    })),
  }
}

export async function getPurchaseByIdForUser(purchaseId: string, userId: string, userEmail: string) {
  const admin = getSupabaseAdminClient()
  const normalizedEmail = userEmail.trim().toLowerCase()

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, access_token, buyer_user_id, buyer_email, status')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!purchase?.access_token || purchase.status === 'revoked') return null
  const ownsPurchase =
    purchase.buyer_user_id === userId ||
    purchase.buyer_email?.toLowerCase() === normalizedEmail

  if (!ownsPurchase) return null
  return getPurchaseByAccessToken(purchase.access_token)
}

export async function resolveFileDownload(accessToken: string, fileId: string): Promise<{ url: string; fileName: string; isLink: boolean } | null> {
  const details = await getPurchaseByAccessToken(accessToken)
  if (!details || details.status !== 'active') return null

  const admin = getSupabaseAdminClient()
  const { data: fileRow } = await admin
    .from('product_files')
    .select('id, file_name, file_type, file_url, storage_path, product_id')
    .eq('id', fileId)
    .eq('product_id', details.productId)
    .maybeSingle()

  if (!fileRow) return null

  if (fileRow.file_type === 'link' && fileRow.file_url) {
    return { url: fileRow.file_url, fileName: fileRow.file_name, isLink: true }
  }

  if (!fileRow.storage_path) return null

  const { data: signedData, error } = await admin.storage
    .from('product-files')
    .createSignedUrl(fileRow.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS, {
      download: fileRow.file_name,
    })

  if (error || !signedData?.signedUrl) return null
  return { url: signedData.signedUrl, fileName: fileRow.file_name, isLink: false }
}
