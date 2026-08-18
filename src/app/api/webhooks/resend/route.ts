import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env, isSupabaseAdminConfigured } from '@/lib/env'

function verifyResendSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(part => {
      const [key, value] = part.split('=')
      return [key, value]
    }),
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  const payload = `${timestamp}.${rawBody}`
  const expected = createHmac('sha256', secret).update(payload).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const secret = env.resend.webhookSecret
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('svix-signature') ?? request.headers.get('resend-signature')

  if (!verifyResendSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ received: true })
  }

  let payload: {
    type?: string
    data?: { email_id?: string; created_at?: string }
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const messageId = payload.data?.email_id
  if (!messageId) {
    return NextResponse.json({ received: true })
  }

  const admin = getSupabaseAdminClient()
  const statusMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'pending',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.failed': 'failed',
  }

  const mappedStatus = payload.type ? statusMap[payload.type] : undefined
  if (!mappedStatus) {
    return NextResponse.json({ received: true })
  }

  await admin
    .from('transactional_email_deliveries')
    .update({
      status: mappedStatus,
      delivered_at: mappedStatus === 'delivered' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_message_id', messageId)

  return NextResponse.json({ received: true })
}
