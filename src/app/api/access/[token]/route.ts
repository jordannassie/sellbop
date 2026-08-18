import 'server-only'

import { NextResponse } from 'next/server'
import { getPurchaseByAccessToken } from '@/lib/services/purchase-access'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const details = await getPurchaseByAccessToken(token)

  if (!details) {
    return NextResponse.json({ error: 'Access unavailable.' }, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return NextResponse.json({
    productTitle: details.productTitle,
    productSlug: details.productSlug,
    coverImageUrl: details.coverImageUrl,
    sellerName: details.sellerName,
    sellerSlug: details.sellerSlug,
    supportEmail: details.supportEmail,
    buyerEmail: details.buyerEmail,
    amountCents: details.amountCents,
    purchasedAt: details.purchasedAt,
    status: details.status,
    files: details.files.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,
      isLink: file.isLink,
      downloadPath: file.downloadPath,
    })),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
