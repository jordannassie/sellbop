// ============================================================
// SELLI DOMAIN ENTITIES
// All core types for the SellBop platform.
// These are provider-agnostic — same types whether using
// demo mode, Supabase, or any future backend.
// ============================================================

export type ProductType = 'digital_download' | 'service_offer' | 'subscription' | 'bundle' | 'membership_ready'
export type ButtonStyle = 'rounded' | 'soft_rounded' | 'square'
export type CardStyle = 'minimal' | 'soft_shadow' | 'outline'
export type HeaderLayout = 'left_avatar' | 'centered' | 'banner_avatar'
export type CardDensity = 'compact' | 'comfortable' | 'large'

export const SECTION_IDS = ['header', 'featured', 'all_products', 'about', 'links', 'testimonials', 'faq'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const DEFAULT_SECTION_ORDER: SectionId[] = ['header', 'featured', 'all_products', 'about', 'links', 'testimonials', 'faq']
export const DEFAULT_SECTION_VISIBILITY: Record<SectionId, boolean> = {
  header: true, featured: true, all_products: true,
  about: true, links: true, testimonials: false, faq: false,
}
export type ProductStatus = 'draft' | 'published' | 'archived'
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'
export type RefundStatus = 'paid' | 'refunded' | 'refund_pending' | 'refund_failed'
export type AccessStatus = 'active' | 'revoked' | 'expired'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'refunded' | 'expired'
export type CancelMode = 'cancel_end_of_period' | 'cancel_immediately'
export type CouponType = 'percent' | 'fixed'
export type SellBopPlan = 'free' | 'starter' | 'pro'
export type FileAssetType = 'pdf' | 'zip' | 'video' | 'audio' | 'image' | 'other'

export interface User {
  id: string
  email: string
  name: string
  role: 'creator' | 'buyer'
  createdAt: string
}

export interface SellerProfile {
  id: string
  userId: string
  slug: string
  displayName: string
  brandName: string | null
  bio: string | null
  avatarUrl: string | null
  logoUrl: string | null
  websiteUrl: string | null
  twitterUrl: string | null
  supportEmail: string
  plan: SellBopPlan
  featuredProductIds: string[]
  themeColor: string
  createdAt: string
}

export interface FileAsset {
  id: string
  sellerId: string
  productId: string | null
  name: string
  fileName: string
  fileSize: number
  fileType: FileAssetType
  mimeType: string
  storagePath: string
  downloadCount: number
  createdAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  price: number
  compareAtPrice: number | null
  sku: string | null
  description: string | null
}

export interface Product {
  id: string
  sellerId: string
  name: string
  slug: string
  description: string
  shortDescription: string | null
  productType: ProductType
  status: ProductStatus
  price: number
  compareAtPrice: number | null
  currency: string
  thumbnailUrl: string | null
  coverImageUrl: string | null
  galleryImageUrls: string[]
  category: string | null
  tags: string[]
  fileAssetIds: string[]
  externalUrl: string | null
  confirmationMessage: string | null
  supportEmail: string | null
  ctaText: string
  seoTitle: string | null
  seoDescription: string | null
  licenseKeyEnabled: boolean
  memberAccessEnabled: boolean
  downloadLimit: number | null
  accessExpirationDays: number | null
  variants: ProductVariant[]
  salesCount: number
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  // ── Marketplace visibility (future-ready) ──────────────
  /** Whether this product appears in the public SellBop marketplace. Defaults to true for published products. */
  marketplaceVisible: boolean
  /** Short excerpt shown on marketplace cards (falls back to shortDescription). Max ~120 chars. */
  marketplaceExcerpt: string | null
}

export interface Order {
  id: string
  sellerId: string
  productId: string
  productName: string
  productType: ProductType
  customerId: string
  customerEmail: string
  customerName: string
  amount: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  refundStatus: RefundStatus
  refundedAt: string | null
  refundReason: string | null
  accessStatus: AccessStatus
  subscriptionId: string | null
  couponId: string | null
  couponCode: string | null
  discountAmount: number
  stripePaymentIntentId: string | null
  stripeSessionId: string | null
  receiptSent: boolean
  internalNotes: string | null
  createdAt: string
}

export interface Customer {
  id: string
  sellerId: string
  email: string
  name: string
  totalSpend: number
  purchaseCount: number
  lastPurchaseAt: string | null
  orderIds: string[]
  createdAt: string
}

export interface DownloadGrant {
  id: string
  orderId: string
  productId: string
  fileAssetId: string
  buyerEmail: string
  token: string
  downloadCount: number
  maxDownloads: number | null
  expiresAt: string | null
  createdAt: string
}

export interface Subscription {
  id: string
  sellerId: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  customerEmail: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  cancelMode: CancelMode | null
  accessStatus: AccessStatus
  latestPaymentStatus: PaymentStatus
  amount: number
  currency: string
  stripeSubscriptionId: string | null
  internalNotes: string | null
  createdAt: string
}

export interface Coupon {
  id: string
  sellerId: string
  code: string
  type: CouponType
  value: number
  maxUses: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
  productIds: string[] | null
  createdAt: string
}

export interface LicenseKey {
  id: string
  orderId: string
  productId: string
  buyerEmail: string
  key: string
  activations: number
  maxActivations: number
  active: boolean
  createdAt: string
}

export interface AnalyticsEvent {
  id: string
  sellerId: string
  productId: string | null
  eventType: 'product_view' | 'checkout_started' | 'purchase_completed' | 'download_started' | 'coupon_applied' | 'storefront_view'
  buyerEmail: string | null
  source: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CheckoutSession {
  id: string
  productId: string
  product: Product
  seller: SellerProfile
  buyerEmail: string | null
  buyerName: string | null
  couponCode: string | null
  couponId: string | null
  discountAmount: number
  subtotal: number
  total: number
  status: 'pending' | 'completed' | 'canceled'
  createdAt: string
}

export interface RefundRequest {
  id: string
  orderId: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  amount: number
  createdAt: string
}

export interface EmailLog {
  id: string
  sellerId: string
  type: 'receipt' | 'download' | 'refund' | 'subscription_confirmed' | 'payment_failed'
  toEmail: string
  subject: string
  orderId: string | null
  status: 'sent' | 'failed' | 'simulated'
  createdAt: string
}

export interface PayoutAccount {
  id: string
  sellerId: string
  provider: 'stripe_connect' | 'manual' | 'placeholder'
  accountId: string | null
  currency: string
  connected: boolean
  createdAt: string
}

export interface PayoutRecord {
  id: string
  sellerId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed'
  periodStart: string
  periodEnd: string
  ordersIncluded: number
  paidAt: string | null
}

export interface Storefront {
  id: string
  sellerId: string
  slug: string
  title: string
  headline: string | null
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  featuredProductIds: string[]
  productOrder: string[]
  hiddenProductIds: string[]
  themeColor: string
  buttonStyle: ButtonStyle
  cardStyle: CardStyle
  headerLayout: HeaderLayout
  cardDensity: CardDensity
  sectionOrder: string[]
  sectionVisibility: Record<string, boolean>
  socialLinks: {
    twitter?: string
    instagram?: string
    youtube?: string
    website?: string
  }
  published: boolean
}
