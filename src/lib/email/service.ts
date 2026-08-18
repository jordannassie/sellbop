import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env, isSupabaseAdminConfigured } from '@/lib/env'
import {
  buildPurchaseReceiptEmail,
  buildPurchaseRecoveryEmail,
  buildRefundEmail,
  buildSellerSaleEmail,
} from '@/lib/email/templates'
import type {
  EmailSendResult,
  SendTransactionalEmailOptions,
} from '@/lib/email/types'

function normalizeRecipient(email: string): string {
  return email.trim().toLowerCase()
}

async function recordDeliveryStart(opts: SendTransactionalEmailOptions): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null
  const admin = getSupabaseAdminClient()

  if (!opts.force) {
    const { data: existing } = await admin
      .from('transactional_email_deliveries')
      .select('id, status, provider_message_id')
      .eq('event_key', opts.idempotencyKey)
      .maybeSingle()

    if (existing && ['accepted', 'sent', 'delivered'].includes(existing.status)) {
      return existing.id
    }
  }

  const { data, error } = await admin
    .from('transactional_email_deliveries')
    .upsert({
      event_key: opts.force ? `${opts.idempotencyKey}/${Date.now()}` : opts.idempotencyKey,
      email_type: opts.emailType,
      recipient: normalizeRecipient(opts.to),
      order_id: opts.orderId ?? null,
      purchase_id: opts.purchaseId ?? null,
      seller_user_id: opts.sellerUserId ?? null,
      provider: 'resend',
      status: 'pending',
      attempts: 1,
      metadata: opts.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_key' })
    .select('id')
    .single()

  if (error) {
    console.error('[email] failed to record delivery start', error.message)
    return null
  }
  return data?.id ?? null
}

async function recordDeliveryResult(
  deliveryId: string | null,
  result: EmailSendResult,
): Promise<void> {
  if (!deliveryId || !isSupabaseAdminConfigured()) return
  const admin = getSupabaseAdminClient()

  await admin
    .from('transactional_email_deliveries')
    .update({
      status: result.simulated ? 'simulated' : result.sent ? 'accepted' : 'failed',
      provider_message_id: result.providerMessageId ?? null,
      last_error: result.error ?? null,
      sent_at: result.sent || result.simulated ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
}

export async function sendTransactionalEmail(
  opts: SendTransactionalEmailOptions,
): Promise<EmailSendResult> {
  const deliveryId = await recordDeliveryStart(opts)

  if (!env.resend.apiKey) {
    if (process.env.NODE_ENV === 'production') {
      const result: EmailSendResult = {
        accepted: false,
        sent: false,
        simulated: false,
        deliveryId: deliveryId ?? undefined,
        error: 'RESEND_API_KEY not configured',
      }
      await recordDeliveryResult(deliveryId, result)
      console.error('[email] RESEND_API_KEY missing in production')
      return result
    }

    console.log(`[EMAIL SIMULATED] To: ${opts.to} | Subject: ${opts.subject}`)
    const result: EmailSendResult = {
      accepted: true,
      sent: false,
      simulated: true,
      deliveryId: deliveryId ?? undefined,
    }
    await recordDeliveryResult(deliveryId, result)
    return result
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': opts.idempotencyKey,
      },
      body: JSON.stringify({
        from: env.email.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo ?? env.email.replyTo,
      }),
    })

    const bodyText = await res.text()
    if (!res.ok) {
      console.error('[email] Resend error', res.status, bodyText)
      const result: EmailSendResult = {
        accepted: false,
        sent: false,
        simulated: false,
        deliveryId: deliveryId ?? undefined,
        error: `Resend HTTP ${res.status}`,
      }
      await recordDeliveryResult(deliveryId, result)
      return result
    }

    let providerMessageId: string | undefined
    try {
      const parsed = JSON.parse(bodyText) as { id?: string }
      providerMessageId = parsed.id
    } catch {
      // ignore parse errors
    }

    const result: EmailSendResult = {
      accepted: true,
      sent: true,
      simulated: false,
      providerMessageId,
      deliveryId: deliveryId ?? undefined,
    }
    await recordDeliveryResult(deliveryId, result)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error'
    console.error('[email] send failed', message)
    const result: EmailSendResult = {
      accepted: false,
      sent: false,
      simulated: false,
      deliveryId: deliveryId ?? undefined,
      error: message,
    }
    await recordDeliveryResult(deliveryId, result)
    return result
  }
}

export async function sendPurchaseReceiptEmail(params: {
  to: string
  replyTo: string
  orderId: string
  purchaseId: string
  accessUrl: string
  buyerName: string | null
  productTitle: string
  sellerName: string
  amountCents: number
  currency?: string
  purchaseDate: string
  supportEmail: string
  isFree?: boolean
  force?: boolean
}): Promise<EmailSendResult> {
  const libraryUrl = `${env.app.url}/login?next=/dashboard/library`
  const template = buildPurchaseReceiptEmail({
    buyerName: params.buyerName,
    productTitle: params.productTitle,
    sellerName: params.sellerName,
    amountCents: params.amountCents,
    currency: params.currency ?? 'USD',
    orderId: params.orderId,
    purchaseDate: params.purchaseDate,
    accessUrl: params.accessUrl,
    supportEmail: params.supportEmail,
    libraryUrl,
    isFree: params.isFree ?? params.amountCents === 0,
  })

  return sendTransactionalEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: params.replyTo,
    idempotencyKey: params.force
      ? `purchase-receipt/${params.orderId}/${Date.now()}`
      : `purchase-receipt/${params.orderId}`,
    emailType: params.isFree || params.amountCents === 0 ? 'free_product_delivery' : 'purchase_receipt',
    orderId: params.orderId,
    purchaseId: params.purchaseId,
    force: params.force,
  })
}

export async function sendSellerSaleEmail(params: {
  to: string
  sellerUserId: string
  orderId: string
  productTitle: string
  sellerName: string
  buyerEmail: string
  grossCents: number
  netCents: number
  platformFeeCents: number
  affiliateCommissionCents?: number
  isFree?: boolean
}): Promise<EmailSendResult> {
  const orderUrl = `${env.app.url}/dashboard/orders/${params.orderId}`
  const template = buildSellerSaleEmail({
    sellerName: params.sellerName,
    productTitle: params.productTitle,
    buyerEmail: params.buyerEmail,
    grossCents: params.grossCents,
    netCents: params.netCents,
    platformFeeCents: params.platformFeeCents,
    affiliateCommissionCents: params.affiliateCommissionCents,
    orderUrl,
    isFree: params.isFree ?? params.grossCents === 0,
  })

  return sendTransactionalEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: env.email.replyTo,
    idempotencyKey: `seller-sale/${params.orderId}`,
    emailType: params.isFree || params.grossCents === 0 ? 'seller_new_customer' : 'seller_sale',
    orderId: params.orderId,
    sellerUserId: params.sellerUserId,
  })
}

export async function sendRefundEmail(params: {
  to: string
  replyTo: string
  orderId: string
  purchaseId?: string
  buyerName: string | null
  productTitle: string
  sellerName: string
  refundCents: number
  totalCents: number
  isPartial: boolean
  supportEmail: string
  refundId?: string
}): Promise<EmailSendResult> {
  const template = buildRefundEmail({
    buyerName: params.buyerName,
    productTitle: params.productTitle,
    sellerName: params.sellerName,
    refundCents: params.refundCents,
    totalCents: params.totalCents,
    orderId: params.orderId,
    isPartial: params.isPartial,
    supportEmail: params.supportEmail,
  })

  return sendTransactionalEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: params.replyTo,
    idempotencyKey: `refund/${params.orderId}/${params.refundId ?? params.refundCents}`,
    emailType: params.isPartial ? 'refund_partial' : 'refund_full',
    orderId: params.orderId,
    purchaseId: params.purchaseId,
  })
}

export async function sendPurchaseRecoveryEmail(params: {
  to: string
  accessLinks: Array<{ productTitle: string; accessUrl: string }>
}): Promise<EmailSendResult> {
  const template = buildPurchaseRecoveryEmail({ accessLinks: params.accessLinks })
  return sendTransactionalEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: env.email.replyTo,
    idempotencyKey: `purchase-recovery/${normalizeRecipient(params.to)}/${Math.floor(Date.now() / 60000)}`,
    emailType: 'purchase_recovery',
  })
}

export function getEmailConfigStatus() {
  return {
    resendConfigured: !!env.resend.apiKey,
    fromConfigured: !!env.email.from,
    replyToConfigured: !!env.email.replyTo,
    supportEmailConfigured: !!env.email.supportEmail,
    webhookConfigured: !!env.resend.webhookSecret,
  }
}

// Re-export legacy names for any existing imports
export { sendTransactionalEmail as sendEmail }
