import 'server-only'

import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { sendPurchaseRecoveryEmail } from '@/lib/email/service'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'

const attemptLog = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const attempts = (attemptLog.get(key) ?? []).filter(ts => now - ts < 15 * 60_000)
  attempts.push(now)
  attemptLog.set(key, attempts)
  return attempts.length > 5
}

export async function POST(request: Request) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  }

  const generic = {
    ok: true,
    message: 'If purchases exist for that email, we sent you an access email.',
  }

  if (isRateLimited(email)) {
    return NextResponse.json(generic)
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(generic)
  }

  const admin = getSupabaseAdminClient()
  const { data: purchases } = await admin
    .from('purchases')
    .select('id, access_token, product_id, status')
    .ilike('buyer_email', email)
    .eq('status', 'active')
    .not('access_token', 'is', null)
    .limit(10)

  const active = (purchases ?? []).filter(p => p.access_token)
  if (active.length === 0) {
    return NextResponse.json(generic)
  }

  const productIds = [...new Set(active.map(p => p.product_id))]
  const { data: products } = await admin
    .from('products')
    .select('id, title')
    .in('id', productIds)

  const titleById = new Map((products ?? []).map(p => [p.id, p.title]))

  const accessLinks = active.map(purchase => ({
    productTitle: titleById.get(purchase.product_id) ?? 'Product',
    accessUrl: getPurchaseAccessUrl(purchase.access_token!),
  }))

  await sendPurchaseRecoveryEmail({ to: email, accessLinks })

  return NextResponse.json(generic)
}
