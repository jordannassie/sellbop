'use client'
import {
  demoProductRepo, demoOrderRepo, demoCustomerRepo,
  demoCouponRepo, demoDownloadRepo, demoAnalyticsRepo, demoEmailRepo,
} from '@/lib/adapters/demo/repositories'
import type { CheckoutSession, Order } from '@/lib/domain/entities'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

function genToken(): string {
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function createCheckoutSession(productId: string): Promise<CheckoutSession | null> {
  const product = await demoProductRepo.findById(productId)
  if (!product) return null

  return {
    id: `cs-${Date.now()}`,
    productId,
    product,
    seller: DEMO_SELLER_PROFILE,
    buyerEmail: null,
    buyerName: null,
    couponCode: null,
    couponId: null,
    discountAmount: 0,
    subtotal: product.price,
    total: product.price,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export async function applyCoupon(
  session: CheckoutSession,
  code: string
): Promise<{ session: CheckoutSession; error: string | null }> {
  const coupon = await demoCouponRepo.findByCode(session.seller.id, code)

  if (!coupon) return { session, error: 'Coupon not found.' }
  if (!coupon.active) return { session, error: 'This coupon is no longer active.' }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { session, error: 'This coupon has reached its usage limit.' }
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { session, error: 'This coupon has expired.' }
  }
  if (coupon.productIds && !coupon.productIds.includes(session.productId)) {
    return { session, error: 'This coupon does not apply to this product.' }
  }

  const discount =
    coupon.type === 'percent'
      ? Math.floor(session.subtotal * (coupon.value / 100))
      : coupon.value

  const updated: CheckoutSession = {
    ...session,
    couponCode: coupon.code,
    couponId: coupon.id,
    discountAmount: discount,
    total: Math.max(0, session.subtotal - discount),
  }

  return { session: updated, error: null }
}

export async function completeCheckout(
  session: CheckoutSession,
  buyerEmail: string,
  buyerName: string
): Promise<Order> {
  const sellerId = session.seller.id

  // Create or update customer
  let customer = await demoCustomerRepo.findByEmail(sellerId, buyerEmail)
  if (!customer) {
    customer = await demoCustomerRepo.create({
      sellerId,
      email: buyerEmail,
      name: buyerName,
      totalSpend: session.total,
      purchaseCount: 1,
      lastPurchaseAt: new Date().toISOString(),
      orderIds: [],
    })
  } else {
    await demoCustomerRepo.update(customer.id, {
      totalSpend: customer.totalSpend + session.total,
      purchaseCount: customer.purchaseCount + 1,
      lastPurchaseAt: new Date().toISOString(),
    })
  }

  // Create order
  const order = await demoOrderRepo.create({
    sellerId,
    productId: session.productId,
    productName: session.product.name,
    productType: session.product.productType,
    customerId: customer.id,
    customerEmail: buyerEmail,
    customerName: buyerName,
    amount: session.total,
    currency: session.product.currency,
    status: 'completed',
    paymentStatus: 'paid',
    refundStatus: 'paid',
    refundedAt: null,
    refundReason: null,
    accessStatus: 'active',
    subscriptionId: null,
    couponId: session.couponId,
    couponCode: session.couponCode,
    discountAmount: session.discountAmount,
    stripePaymentIntentId: null,
    stripeSessionId: session.id,
    receiptSent: true,
    internalNotes: null,
  })

  // Increment coupon use
  if (session.couponId) {
    await demoCouponRepo.incrementUse(session.couponId)
  }

  // Create download grants for digital products
  if (session.product.productType === 'digital_download' || session.product.productType === 'bundle') {
    for (const fileId of session.product.fileAssetIds) {
      const expiresAt = session.product.accessExpirationDays
        ? new Date(Date.now() + session.product.accessExpirationDays * 86400000).toISOString()
        : null

      await demoDownloadRepo.create({
        orderId: order.id,
        productId: session.productId,
        fileAssetId: fileId,
        buyerEmail,
        token: genToken(),
        downloadCount: 0,
        maxDownloads: session.product.downloadLimit,
        expiresAt,
      })
    }
  }

  // Track analytics
  await demoAnalyticsRepo.create({
    sellerId,
    productId: session.productId,
    eventType: 'purchase_completed',
    buyerEmail,
    source: 'direct',
    metadata: { amount: session.total, orderId: order.id },
  })

  // Log simulated receipt email
  await demoEmailRepo.create({
    sellerId,
    type: 'receipt',
    toEmail: buyerEmail,
    subject: `Your receipt — ${session.product.name}`,
    orderId: order.id,
    status: 'simulated',
  })

  return order
}
