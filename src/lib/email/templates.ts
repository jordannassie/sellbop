import { env } from '@/lib/env'
import {
  escapeHtml,
  formatMoney,
  formatPurchaseDate,
  shortOrderId,
} from '@/lib/email/escape'
import type {
  PurchaseReceiptTemplateData,
  RefundEmailTemplateData,
  SellerSaleTemplateData,
} from '@/lib/email/types'

const BRAND_GREEN = '#00E676'

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 28px 8px;">
          <strong style="font-size:18px;letter-spacing:-0.02em;">SellBop</strong>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;">${content}</td></tr>
      </table>
      <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#999;line-height:1.5;">
        Powered by SellBop · <a href="${escapeHtml(env.app.url)}" style="color:#999;">sellbop.com</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr><td style="border-radius:12px;background:#000;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`
}

function secondaryLink(label: string, href: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;color:#666;">
    <a href="${escapeHtml(href)}" style="color:#111;font-weight:600;">${escapeHtml(label)}</a>
  </p>`
}

export function buildPurchaseReceiptEmail(data: PurchaseReceiptTemplateData): { html: string; text: string; subject: string } {
  const greeting = data.buyerName ? `Hi ${data.buyerName},` : 'Hi there,'
  const subject = data.isFree
    ? `Your download is ready — ${data.productTitle}`
    : `Your purchase is ready — ${data.productTitle}`

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;">Your purchase is ready</h1>
    <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.5;">${escapeHtml(greeting)}</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px;margin-bottom:8px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;">${escapeHtml(data.productTitle)}</p>
      <p style="margin:0;color:#666;font-size:14px;">Sold by ${escapeHtml(data.sellerName)}</p>
      <p style="margin:10px 0 0;font-size:14px;color:#666;">
        ${escapeHtml(formatMoney(data.amountCents, data.currency))} · Order #${escapeHtml(shortOrderId(data.orderId))}
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#999;">${escapeHtml(formatPurchaseDate(data.purchaseDate))}</p>
    </div>
    ${ctaButton('Access Your Product', data.accessUrl)}
    ${secondaryLink('Sign in to keep purchases in your Library', data.libraryUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:#666;line-height:1.5;">
      Questions about your purchase? Reply to this email or contact
      <a href="mailto:${escapeHtml(data.supportEmail)}" style="color:#111;">${escapeHtml(data.supportEmail)}</a>.
    </p>
  `)

  const text = [
    'Your purchase is ready',
    '',
    greeting,
    '',
    `${data.productTitle}`,
    `Sold by ${data.sellerName}`,
    `${formatMoney(data.amountCents, data.currency)} · Order #${shortOrderId(data.orderId)}`,
    formatPurchaseDate(data.purchaseDate),
    '',
    'Access Your Product:',
    data.accessUrl,
    '',
    `Library: ${data.libraryUrl}`,
    '',
    `Support: ${data.supportEmail}`,
  ].join('\n')

  return { html, text, subject }
}

export function buildSellerSaleEmail(data: SellerSaleTemplateData): { html: string; text: string; subject: string } {
  const subject = data.isFree
    ? `New customer — ${data.productTitle}`
    : `You made a sale — ${data.productTitle}`

  const affiliateLine = data.affiliateCommissionCents
    ? `<p style="margin:8px 0 0;font-size:13px;color:#666;">Affiliate commission: ${escapeHtml(formatMoney(data.affiliateCommissionCents))}</p>`
    : ''

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;">${data.isFree ? 'New customer' : 'You made a sale!'}</h1>
    <p style="margin:0 0 20px;color:#666;font-size:15px;">Hi ${escapeHtml(data.sellerName)},</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;">${escapeHtml(data.productTitle)}</p>
      <p style="margin:0;color:#666;font-size:14px;">Buyer: ${escapeHtml(data.buyerEmail)}</p>
      <p style="margin:10px 0 0;font-size:20px;font-weight:700;">
        ${escapeHtml(formatMoney(data.grossCents))}
        <span style="font-size:14px;font-weight:400;color:#666;"> (${escapeHtml(formatMoney(data.netCents))} net)</span>
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#666;">SellBop fee: ${escapeHtml(formatMoney(data.platformFeeCents))}</p>
      ${affiliateLine}
    </div>
    ${ctaButton('View Order', data.orderUrl)}
  `)

  const text = [
    data.isFree ? 'New customer' : 'You made a sale!',
    '',
    `Product: ${data.productTitle}`,
    `Buyer: ${data.buyerEmail}`,
    `Gross: ${formatMoney(data.grossCents)}`,
    `Net: ${formatMoney(data.netCents)}`,
    `SellBop fee: ${formatMoney(data.platformFeeCents)}`,
    '',
    `View order: ${data.orderUrl}`,
  ].join('\n')

  return { html, text, subject }
}

export function buildRefundEmail(data: RefundEmailTemplateData): { html: string; text: string; subject: string } {
  const subject = data.isPartial
    ? `Partial refund processed — ${data.productTitle}`
    : `Refund processed — ${data.productTitle}`

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:24px;">${data.isPartial ? 'Partial refund processed' : 'Refund processed'}</h1>
    <p style="margin:0 0 20px;color:#666;font-size:15px;">${data.buyerName ? `Hi ${escapeHtml(data.buyerName)},` : 'Hi there,'}</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;">${escapeHtml(data.productTitle)}</p>
      <p style="margin:0;color:#666;font-size:14px;">Sold by ${escapeHtml(data.sellerName)}</p>
      <p style="margin:10px 0 0;font-size:14px;color:#666;">
        Refund: ${escapeHtml(formatMoney(data.refundCents))}${data.isPartial ? ` of ${escapeHtml(formatMoney(data.totalCents))}` : ''}
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#999;">Order #${escapeHtml(shortOrderId(data.orderId))}</p>
    </div>
    ${data.isPartial ? '<p style="margin:16px 0 0;font-size:14px;color:#666;">Your product access remains active.</p>' : '<p style="margin:16px 0 0;font-size:14px;color:#666;">Your product access has been revoked.</p>'}
    <p style="margin:20px 0 0;font-size:13px;color:#666;">
      Questions? Contact <a href="mailto:${escapeHtml(data.supportEmail)}" style="color:#111;">${escapeHtml(data.supportEmail)}</a>.
    </p>
  `)

  const text = [
    data.isPartial ? 'Partial refund processed' : 'Refund processed',
    '',
    `${data.productTitle} by ${data.sellerName}`,
    `Refund: ${formatMoney(data.refundCents)}${data.isPartial ? ` of ${formatMoney(data.totalCents)}` : ''}`,
    `Order #${shortOrderId(data.orderId)}`,
    '',
    `Support: ${data.supportEmail}`,
  ].join('\n')

  return { html, text, subject }
}

export function buildPurchaseRecoveryEmail({
  accessLinks,
}: {
  accessLinks: Array<{ productTitle: string; accessUrl: string }>
}): { html: string; text: string; subject: string } {
  const subject = 'Your SellBop purchase access links'
  const itemsHtml = accessLinks.map(link => `
    <div style="margin:0 0 12px;padding:14px;border:1px solid #eee;border-radius:10px;">
      <p style="margin:0 0 8px;font-weight:600;">${escapeHtml(link.productTitle)}</p>
      <a href="${escapeHtml(link.accessUrl)}" style="color:${BRAND_GREEN};font-weight:600;">Access product</a>
    </div>
  `).join('')

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:24px;">Your purchase links</h1>
    <p style="margin:0 0 20px;color:#666;font-size:15px;">Use the links below to access your products.</p>
    ${itemsHtml}
  `)

  const text = [
    'Your SellBop purchase links',
    '',
    ...accessLinks.flatMap(link => [`${link.productTitle}:`, link.accessUrl, '']),
  ].join('\n')

  return { html, text, subject }
}
