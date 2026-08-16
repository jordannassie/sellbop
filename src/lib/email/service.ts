/**
 * Sellbop Email Service
 *
 * Uses Resend (https://resend.com) when RESEND_API_KEY is configured.
 * Falls back to console logging in development.
 *
 * Required environment variables:
 *   RESEND_API_KEY    — your Resend API key
 *   EMAIL_FROM        — sender address (e.g. "Sellbop <noreply@sellbop.com>")
 */
import { env } from '@/lib/env'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface EmailResult {
  sent: boolean
  simulated: boolean
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<EmailResult> {
  if (!env.resend.apiKey) {
    console.log(`[EMAIL SIMULATED] To: ${opts.to} | Subject: ${opts.subject}`)
    return { sent: false, simulated: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resend.fromEmail,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { sent: false, simulated: false, error: body }
    }

    return { sent: true, simulated: false }
  } catch (err) {
    return { sent: false, simulated: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

export function buildPurchaseConfirmationEmail({
  buyerName,
  productTitle,
  downloadUrl,
  orderId,
  totalCents,
  sellerName,
}: {
  buyerName: string | null
  productTitle: string
  downloadUrl?: string
  orderId: string
  totalCents: number
  sellerName: string
}): string {
  const greeting = buyerName ? `Hi ${buyerName},` : 'Hi there,'
  const amount = totalCents === 0 ? 'Free' : `$${(totalCents / 100).toFixed(2)}`

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="margin-bottom: 24px;">
    <strong style="font-size: 18px;">Sellbop</strong>
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Your purchase is confirmed</h1>
  <p style="color: #666; margin-bottom: 24px;">${greeting}</p>
  <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="margin: 0 0 4px; font-weight: 600;">${productTitle}</p>
    <p style="margin: 0; color: #666; font-size: 14px;">Sold by ${sellerName} · ${amount}</p>
  </div>
  ${downloadUrl ? `
  <a href="${downloadUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; margin-bottom: 24px;">
    Download Your Product
  </a>
  ` : ''}
  <p style="color: #999; font-size: 12px;">Order ID: ${orderId}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">Powered by Sellbop · <a href="https://sellbop.com" style="color: #999;">sellbop.com</a></p>
</body>
</html>
`.trim()
}

export function buildSaleMadeEmail({
  sellerName,
  productTitle,
  buyerEmail,
  totalCents,
  netCents,
}: {
  sellerName: string
  productTitle: string
  buyerEmail: string
  totalCents: number
  netCents: number
}): string {
  const gross = `$${(totalCents / 100).toFixed(2)}`
  const net = `$${(netCents / 100).toFixed(2)}`

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="margin-bottom: 24px;"><strong style="font-size: 18px;">Sellbop</strong></div>
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">🎉 You made a sale!</h1>
  <p style="color: #666; margin-bottom: 24px;">Hi ${sellerName}, someone just purchased your product.</p>
  <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="margin: 0 0 4px; font-weight: 600;">${productTitle}</p>
    <p style="margin: 0; color: #666; font-size: 14px;">Buyer: ${buyerEmail}</p>
    <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700;">${gross} <span style="font-size: 14px; font-weight: 400; color: #666;">(${net} net)</span></p>
  </div>
  <a href="https://sellbop.com/dashboard/sales" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">
    View in Dashboard
  </a>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">Powered by Sellbop · <a href="https://sellbop.com" style="color: #999;">sellbop.com</a></p>
</body>
</html>
`.trim()
}
