import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { calculateTransactionFees, type SaleType } from '@/lib/platform-config'
import { calcCommissionCents, calcAvailableAt } from '@/lib/affiliates'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'
import {
  sendPurchaseReceiptEmail,
  sendSellerSaleEmail,
} from '@/lib/email/service'
import type { EmailSendResult } from '@/lib/email/types'

export interface FulfillmentContext {
  productId: string
  storeId: string
  sellerUserId: string
  productTitle: string
  buyerEmail: string
  buyerName?: string | null
  buyerUserId?: string | null
  subtotalCents: number
  discountCents?: number
  totalCents: number
  platformFeeCents?: number
  saleType?: SaleType
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  paymentStatus?: string
  affiliateRelationshipId?: string | null
  affiliateCommissionPercent?: number
  discountCodeId?: string | null
  sendEmails?: boolean
  isPartnerCheckout?: boolean
  partnershipId?: string | null
  financialTermsId?: string | null
}

export interface FulfillmentResult {
  orderId: string
  purchaseId: string
  accessToken: string
  accessUrl: string
  alreadyExisted: boolean
  emails: {
    receipt: EmailSendResult | null
    seller: EmailSendResult | null
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function getSellerNotificationEmail(sellerUserId: string): Promise<{ email: string; name: string } | null> {
  const admin = getSupabaseAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('user_id', sellerUserId)
    .maybeSingle()

  if (!profile?.email) return null
  return {
    email: profile.email,
    name: profile.full_name ?? 'Seller',
  }
}

async function getStoreSupportEmail(storeId: string): Promise<string> {
  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('support_email, name')
    .eq('id', storeId)
    .maybeSingle()

  return store?.support_email ?? env.email.supportEmail
}

async function getStoreName(storeId: string): Promise<string> {
  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('name')
    .eq('id', storeId)
    .maybeSingle()
  return store?.name ?? 'Seller'
}

export async function fulfillPurchase(ctx: FulfillmentContext): Promise<FulfillmentResult | null> {
  const admin = getSupabaseAdminClient()
  const buyerEmail = normalizeEmail(ctx.buyerEmail)
  const totalCents = ctx.totalCents
  const subtotalCents = ctx.subtotalCents
  const discountCents = ctx.discountCents ?? 0
  const platformFeeCents = ctx.platformFeeCents ?? calculateTransactionFees({
    grossAmountCents: totalCents,
    saleType: ctx.saleType ?? 'direct',
  }).sellbopPlatformFeeCents

  // Idempotency via stripe session
  if (ctx.stripeSessionId) {
    const { data: existingOrder } = await admin
      .from('orders')
      .select('id')
      .eq('stripe_session_id', ctx.stripeSessionId)
      .maybeSingle()

    if (existingOrder) {
      const { data: existingPurchase } = await admin
        .from('purchases')
        .select('id, access_token')
        .eq('order_id', existingOrder.id)
        .maybeSingle()

      if (existingPurchase?.access_token) {
        return {
          orderId: existingOrder.id,
          purchaseId: existingPurchase.id,
          accessToken: existingPurchase.access_token,
          accessUrl: getPurchaseAccessUrl(existingPurchase.access_token),
          alreadyExisted: true,
          emails: { receipt: null, seller: null },
        }
      }
    }
  }

  const orderInsert = {
    store_id: ctx.storeId,
    seller_user_id: ctx.sellerUserId,
    buyer_email: buyerEmail,
    buyer_name: ctx.buyerName?.trim() || null,
    buyer_user_id: ctx.buyerUserId ?? null,
    subtotal_cents: subtotalCents,
    shipping_cents: 0,
    total_cents: totalCents,
    discount_cents: discountCents,
    platform_fee_cents: platformFeeCents,
    currency: 'usd',
    status: 'completed',
    payment_status: ctx.paymentStatus ?? (totalCents === 0 ? 'paid' : 'paid'),
    refund_status: 'none',
    stripe_session_id: ctx.stripeSessionId ?? null,
    stripe_payment_intent_id: ctx.stripePaymentIntentId ?? null,
    product_id: ctx.productId,
    product_title_snapshot: ctx.productTitle,
    affiliate_relationship_id: ctx.affiliateRelationshipId ?? null,
  }

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert(orderInsert)
    .select('id, created_at')
    .single()

  if (orderError) {
    // Unique stripe_session_id race — fetch existing
    if (orderError.code === '23505' && ctx.stripeSessionId) {
      const { data: existingOrder } = await admin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', ctx.stripeSessionId)
        .maybeSingle()
      if (existingOrder) {
        const { data: existingPurchase } = await admin
          .from('purchases')
          .select('id, access_token')
          .eq('order_id', existingOrder.id)
          .maybeSingle()
        if (existingPurchase?.access_token) {
          return {
            orderId: existingOrder.id,
            purchaseId: existingPurchase.id,
            accessToken: existingPurchase.access_token,
            accessUrl: getPurchaseAccessUrl(existingPurchase.access_token),
            alreadyExisted: true,
            emails: { receipt: null, seller: null },
          }
        }
      }
    }
    console.error('[fulfillment] order insert failed', orderError.message)
    return null
  }

  await admin.from('order_items').insert({
    order_id: order.id,
    product_id: ctx.productId,
    title: ctx.productTitle,
    quantity: 1,
    unit_price_cents: subtotalCents,
    line_total_cents: totalCents,
  })

  const { data: purchase, error: purchaseError } = await admin
    .from('purchases')
    .insert({
      buyer_email: buyerEmail,
      buyer_user_id: ctx.buyerUserId ?? null,
      product_id: ctx.productId,
      order_id: order.id,
      status: 'active',
      affiliate_relationship_id: ctx.affiliateRelationshipId ?? null,
    })
    .select('id, access_token, created_at')
    .single()

  if (purchaseError || !purchase?.access_token) {
    console.error('[fulfillment] purchase insert failed', purchaseError?.message)
    return null
  }

  let affiliateCommissionCents = 0

  if (ctx.discountCodeId) {
    try {
      await admin.rpc('increment_discount_code_usage' as never, {
        code_id: ctx.discountCodeId,
      } as never)
    } catch {
      // non-blocking
    }
  }

  if (ctx.affiliateRelationshipId && (ctx.affiliateCommissionPercent ?? 0) > 0) {
    const { data: relationship } = await admin
      .from('affiliate_relationships')
      .select('id, affiliate_user_id, seller_id, status')
      .eq('id', ctx.affiliateRelationshipId)
      .maybeSingle()

    if (relationship && relationship.status === 'active') {
      affiliateCommissionCents = calcCommissionCents(totalCents, ctx.affiliateCommissionPercent ?? 0)
      const { data: commission } = await admin
        .from('affiliate_commissions')
        .insert({
          relationship_id: relationship.id,
          affiliate_user_id: relationship.affiliate_user_id,
          seller_id: relationship.seller_id,
          product_id: ctx.productId,
          order_id: order.id,
          gross_sale_cents: totalCents,
          commission_percent: ctx.affiliateCommissionPercent ?? 0,
          commission_cents: affiliateCommissionCents,
          currency: 'usd',
          status: 'pending',
          available_at: calcAvailableAt().toISOString(),
        })
        .select('id')
        .single()

      if (commission) {
        await admin.from('orders').update({ affiliate_commission_id: commission.id }).eq('id', order.id)
      }
    }
  }

  if (ctx.isPartnerCheckout && ctx.partnershipId && ctx.financialTermsId) {
    try {
      const { createPartnerFinancialSnapshot, settlePartnerOrder } = await import('@/lib/payments/partner-settlement')
      const { getCurrentFinancialTerms } = await import('@/lib/partnerships/financial-terms')
      const terms = await getCurrentFinancialTerms(ctx.partnershipId)
      if (terms) {
        let stripeChargeId: string | null = null
        if (ctx.stripePaymentIntentId && env.stripe.secretKey {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe(env.stripe.secretKey
          const pi = await stripe.paymentIntents.retrieve(ctx.stripePaymentIntentId)
          stripeChargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id ?? null
        }
        await createPartnerFinancialSnapshot({
          orderId: order.id,
          storeId: ctx.storeId,
          partnershipId: ctx.partnershipId,
          financialTermsId: ctx.financialTermsId,
          partnerShareBps: terms.partner_share_bps,
          financialModel: terms.financial_model,
          saleSubtotalCents: totalCents,
          discountCents,
          affiliateCommissionCents,
          stripeFeeCents: null,
          stripeCheckoutSessionId: ctx.stripeSessionId ?? null,
          stripePaymentIntentId: ctx.stripePaymentIntentId ?? null,
          stripeChargeId,
        })
        await settlePartnerOrder(order.id)
      }
    } catch (partnerErr) {
      console.error('[fulfillment] partner settlement failed', order.id, partnerErr)
    }
  }

  const accessUrl = getPurchaseAccessUrl(purchase.access_token)
  const emails = { receipt: null as EmailSendResult | null, seller: null as EmailSendResult | null }

  if (ctx.sendEmails !== false) {
    const [supportEmail, sellerName, sellerContact] = await Promise.all([
      getStoreSupportEmail(ctx.storeId),
      getStoreName(ctx.storeId),
      getSellerNotificationEmail(ctx.sellerUserId),
    ])

    emails.receipt = await sendPurchaseReceiptEmail({
      to: buyerEmail,
      replyTo: supportEmail,
      orderId: order.id,
      purchaseId: purchase.id,
      accessUrl,
      buyerName: ctx.buyerName ?? null,
      productTitle: ctx.productTitle,
      sellerName,
      amountCents: totalCents,
      purchaseDate: purchase.created_at ?? order.created_at,
      supportEmail,
      isFree: totalCents === 0,
    })

    if (sellerContact) {
      emails.seller = await sendSellerSaleEmail({
        to: sellerContact.email,
        sellerUserId: ctx.sellerUserId,
        orderId: order.id,
        productTitle: ctx.productTitle,
        sellerName: sellerContact.name,
        buyerEmail,
        grossCents: totalCents,
        netCents: Math.max(0, totalCents - platformFeeCents - affiliateCommissionCents),
        platformFeeCents,
        affiliateCommissionCents: affiliateCommissionCents || undefined,
        isFree: totalCents === 0,
      })
    }
  }

  return {
    orderId: order.id,
    purchaseId: purchase.id,
    accessToken: purchase.access_token,
    accessUrl,
    alreadyExisted: false,
    emails,
  }
}

export async function fulfillFromStripeSession(
  session: {
    id: string
    metadata?: Record<string, string> | null
    customer_email?: string | null
    amount_total?: number | null
    payment_intent?: string | { id?: string } | null
    payment_status?: string | null
  },
  options?: { sendEmails?: boolean },
): Promise<FulfillmentResult | null> {
  const paymentStatus = session.payment_status ?? 'unpaid'
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
    return null
  }

  const meta = session.metadata ?? {}
  const productId = meta.sellbop_product_id
  const storeId = meta.sellbop_store_id
  const buyerEmail = meta.buyer_email ?? session.customer_email
  if (!productId || !storeId || !buyerEmail) return null

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', storeId)
    .maybeSingle()
  if (!store) return null

  const { data: product } = await admin
    .from('products')
    .select('id, title, price_cents')
    .eq('id', productId)
    .maybeSingle()
  if (!product) return null

  const discountCents = parseInt(meta.discount_cents ?? '0', 10)
  const subtotalCents = parseInt(meta.subtotal_cents ?? '0', 10)
  const totalCents = session.amount_total ?? subtotalCents ?? product.price_cents ?? 0
  const storedPlatformFee = meta.platform_fee_cents
    ? parseInt(meta.platform_fee_cents, 10)
    : undefined
  const saleType = (meta.sale_source === 'marketplace' ? 'marketplace' : 'direct') as SaleType
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null

  return fulfillPurchase({
    productId,
    storeId,
    sellerUserId: store.owner_user_id,
    productTitle: product.title,
    buyerEmail,
    buyerName: meta.buyer_name || null,
    subtotalCents: subtotalCents > 0 ? subtotalCents : totalCents + discountCents,
    discountCents,
    totalCents,
    platformFeeCents: Number.isFinite(storedPlatformFee) ? storedPlatformFee : undefined,
    saleType,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    paymentStatus: 'paid',
    affiliateRelationshipId: meta.affiliate_relationship_id || null,
    affiliateCommissionPercent: meta.affiliate_commission_percent
      ? parseInt(meta.affiliate_commission_percent, 10)
      : 0,
    discountCodeId: meta.discount_code_id || null,
    sendEmails: options?.sendEmails,
    isPartnerCheckout: meta.sellbop_partner_checkout === 'true',
    partnershipId: meta.sellbop_partnership_id || null,
    financialTermsId: meta.sellbop_financial_terms_id || null,
  })
}
