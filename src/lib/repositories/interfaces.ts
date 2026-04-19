// ============================================================
// REPOSITORY INTERFACES
// Every repository must implement these interfaces.
// Swap demo adapters for Supabase/Postgres adapters here.
// ============================================================

import type {
  User, SellerProfile, Product, Order, Customer,
  DownloadGrant, Subscription, Coupon, LicenseKey,
  AnalyticsEvent, FileAsset, RefundRequest, EmailLog,
  PayoutRecord, Storefront,
} from '@/lib/domain/entities'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
}

export interface ISellerProfileRepository {
  findByUserId(userId: string): Promise<SellerProfile | null>
  findBySlug(slug: string): Promise<SellerProfile | null>
  create(data: Omit<SellerProfile, 'id' | 'createdAt'>): Promise<SellerProfile>
  update(id: string, data: Partial<SellerProfile>): Promise<SellerProfile>
}

export interface IProductRepository {
  findAll(sellerId: string): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  findBySellerId(sellerId: string, opts?: { status?: string }): Promise<Product[]>
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'salesCount' | 'viewCount'>): Promise<Product>
  update(id: string, data: Partial<Product>): Promise<Product>
  delete(id: string): Promise<void>
  incrementView(id: string): Promise<void>
}

export interface IOrderRepository {
  findAll(sellerId: string): Promise<Order[]>
  findById(id: string): Promise<Order | null>
  findByCustomerId(customerId: string): Promise<Order[]>
  findByProductId(productId: string): Promise<Order[]>
  create(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order>
  update(id: string, data: Partial<Order>): Promise<Order>
}

export interface ICustomerRepository {
  findAll(sellerId: string): Promise<Customer[]>
  findById(id: string): Promise<Customer | null>
  findByEmail(sellerId: string, email: string): Promise<Customer | null>
  create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  update(id: string, data: Partial<Customer>): Promise<Customer>
}

export interface IDownloadGrantRepository {
  findByToken(token: string): Promise<DownloadGrant | null>
  findByOrderId(orderId: string): Promise<DownloadGrant[]>
  create(data: Omit<DownloadGrant, 'id' | 'createdAt'>): Promise<DownloadGrant>
  incrementDownload(id: string): Promise<void>
}

export interface ISubscriptionRepository {
  findBySellerId(sellerId: string): Promise<Subscription[]>
  findByCustomerId(customerId: string): Promise<Subscription[]>
  create(data: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription>
  update(id: string, data: Partial<Subscription>): Promise<Subscription>
}

export interface ICouponRepository {
  findBySellerId(sellerId: string): Promise<Coupon[]>
  findByCode(sellerId: string, code: string): Promise<Coupon | null>
  create(data: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon>
  update(id: string, data: Partial<Coupon>): Promise<Coupon>
  incrementUse(id: string): Promise<void>
}

export interface IFileAssetRepository {
  findBySellerId(sellerId: string): Promise<FileAsset[]>
  findByProductId(productId: string): Promise<FileAsset[]>
  findById(id: string): Promise<FileAsset | null>
  create(data: Omit<FileAsset, 'id' | 'createdAt' | 'downloadCount'>): Promise<FileAsset>
  delete(id: string): Promise<void>
  incrementDownload(id: string): Promise<void>
}

export interface IAnalyticsRepository {
  findBySellerId(sellerId: string, opts?: { days?: number }): Promise<AnalyticsEvent[]>
  create(data: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent>
}

export interface IEmailLogRepository {
  findBySellerId(sellerId: string): Promise<EmailLog[]>
  create(data: Omit<EmailLog, 'id' | 'createdAt'>): Promise<EmailLog>
}

export interface IPayoutRepository {
  findBySellerId(sellerId: string): Promise<PayoutRecord[]>
  create(data: Omit<PayoutRecord, 'id'>): Promise<PayoutRecord>
}

export interface IStorefrontRepository {
  findBySellerSlug(slug: string): Promise<Storefront | null>
  findBySellerId(sellerId: string): Promise<Storefront | null>
  upsert(data: Omit<Storefront, 'id'>): Promise<Storefront>
}
