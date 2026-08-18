import 'server-only'

import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { sendPurchaseReceiptEmail } from '@/lib/email/service'
import { getPurchaseByAccessToken } from '@/lib/services/purchase-access'

const RATE_LIMIT_MS = 60_000
const recentResends = new Map<string, number>()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const last = recentResends.get(token) ?? 0
  if (Date.now() - last < RATE_LIMIT_MS) {
    return NextResponse.json({
      ok: true,
      message: 'If a receipt can be sent, it will arrive shortly.',
    })
  }
  recentResends.set(token, Date.now())

  const details = await getPurchaseByAccessToken(token)
  if (!details || details.status !== 'active') {
    return NextResponse.json({
      ok: true,
      message: 'If a receipt can be sent, it will arrive shortly.',
    })
  }

  await sendPurchaseReceiptEmail({
    to: details.buyerEmail,
    replyTo: details.supportEmail ?? env.email.supportEmail,
    orderId: details.orderId,
    purchaseId: details.purchaseId,
    accessUrl: `${env.app.url}/access/${token}`,
    buyerName: details.buyerName,
    productTitle: details.productTitle,
    sellerName: details.sellerName,
    amountCents: details.amountCents,
    purchaseDate: details.purchasedAt,
    supportEmail: details.supportEmail,
    isFree: details.amountCents === 0,
    force: true,
  })

  return NextResponse.json({
    ok: true,
    message: 'If a receipt can be sent, it will arrive shortly.',
  })
}
