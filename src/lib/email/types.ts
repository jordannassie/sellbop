export type TransactionalEmailType =
  | 'purchase_receipt'
  | 'free_product_delivery'
  | 'seller_sale'
  | 'seller_new_customer'
  | 'refund_full'
  | 'refund_partial'
  | 'purchase_recovery'
  | 'test'

export type EmailDeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'complained'
  | 'simulated'

export interface SendTransactionalEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  idempotencyKey: string
  emailType: TransactionalEmailType
  orderId?: string
  purchaseId?: string
  sellerUserId?: string
  metadata?: Record<string, unknown>
  /** Manual resends bypass DB idempotency when true */
  force?: boolean
}

export interface EmailSendResult {
  accepted: boolean
  sent: boolean
  simulated: boolean
  providerMessageId?: string
  deliveryId?: string
  error?: string
}

export interface PurchaseReceiptTemplateData {
  buyerName: string | null
  productTitle: string
  sellerName: string
  amountCents: number
  currency: string
  orderId: string
  purchaseDate: string
  accessUrl: string
  supportEmail: string
  libraryUrl: string
  isFree: boolean
}

export interface SellerSaleTemplateData {
  sellerName: string
  productTitle: string
  buyerEmail: string
  grossCents: number
  netCents: number
  platformFeeCents: number
  affiliateCommissionCents?: number
  orderUrl: string
  isFree: boolean
}

export interface RefundEmailTemplateData {
  buyerName: string | null
  productTitle: string
  sellerName: string
  refundCents: number
  totalCents: number
  orderId: string
  isPartial: boolean
  supportEmail: string
}
