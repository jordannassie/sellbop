'use client'
// ============================================================
// DEMO REPOSITORIES — localStorage-backed with seed data fallback
// All repository interfaces are implemented here for demo mode.
// Swap each class for a SupabaseXxxRepository in production.
// ============================================================

import type {
  Product, Order, Customer, Coupon, FileAsset,
  DownloadGrant, Subscription, AnalyticsEvent,
  EmailLog, PayoutRecord, Storefront,
} from '@/lib/domain/entities'
import type {
  IProductRepository, IOrderRepository, ICustomerRepository,
  ICouponRepository, IFileAssetRepository, IAnalyticsRepository,
  IEmailLogRepository, IPayoutRepository, IStorefrontRepository,
  IDownloadGrantRepository, ISubscriptionRepository,
} from '@/lib/repositories/interfaces'
import {
  DEMO_PRODUCTS, DEMO_ORDERS, DEMO_CUSTOMERS, DEMO_COUPONS,
  DEMO_FILE_ASSETS, DEMO_DOWNLOAD_GRANTS, DEMO_SUBSCRIPTIONS,
  DEMO_ANALYTICS_EVENTS, DEMO_EMAIL_LOGS, DEMO_PAYOUTS, DEMO_STOREFRONT,
} from '@/lib/demo-data/seed'

// ─── STORAGE HELPERS ────────────────────────────────────────
function getStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  const raw = localStorage.getItem(`sellbop_demo_${key}`)
  if (!raw) return fallback
  try { return JSON.parse(raw) as T[] } catch { return fallback }
}

function setStored<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`sellbop_demo_${key}`, JSON.stringify(data))
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── PRODUCT REPO ────────────────────────────────────────────
export class DemoProductRepository implements IProductRepository {
  private key = 'products'

  async findAll(sellerId: string): Promise<Product[]> {
    return getStored<Product>(this.key, DEMO_PRODUCTS).filter(p => p.sellerId === sellerId)
  }
  async findById(id: string): Promise<Product | null> {
    return getStored<Product>(this.key, DEMO_PRODUCTS).find(p => p.id === id) ?? null
  }
  async findBySlug(slug: string): Promise<Product | null> {
    return getStored<Product>(this.key, DEMO_PRODUCTS).find(p => p.slug === slug) ?? null
  }
  async findBySellerId(sellerId: string, opts?: { status?: string }): Promise<Product[]> {
    let products = getStored<Product>(this.key, DEMO_PRODUCTS).filter(p => p.sellerId === sellerId)
    if (opts?.status) products = products.filter(p => p.status === opts.status)
    return products
  }
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'salesCount' | 'viewCount'>): Promise<Product> {
    const all = getStored<Product>(this.key, DEMO_PRODUCTS)
    const now = new Date().toISOString()
    const product: Product = { ...data, id: genId('product'), salesCount: 0, viewCount: 0, createdAt: now, updatedAt: now }
    setStored(this.key, [...all, product])
    return product
  }
  async update(id: string, data: Partial<Product>): Promise<Product> {
    const all = getStored<Product>(this.key, DEMO_PRODUCTS)
    const updated = all.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    setStored(this.key, updated)
    return updated.find(p => p.id === id)!
  }
  async delete(id: string): Promise<void> {
    const all = getStored<Product>(this.key, DEMO_PRODUCTS).filter(p => p.id !== id)
    setStored(this.key, all)
  }
  async incrementView(id: string): Promise<void> {
    const all = getStored<Product>(this.key, DEMO_PRODUCTS)
    setStored(this.key, all.map(p => p.id === id ? { ...p, viewCount: p.viewCount + 1 } : p))
  }
  /** Save a full Product (preserving its existing ID). Inserts if new, replaces if ID exists. */
  async upsert(product: Product): Promise<void> {
    const all = getStored<Product>(this.key, DEMO_PRODUCTS)
    const idx = all.findIndex(p => p.id === product.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...product, updatedAt: new Date().toISOString() }
      setStored(this.key, all)
    } else {
      setStored(this.key, [...all, product])
    }
  }
}

// ─── ORDER REPO ──────────────────────────────────────────────
export class DemoOrderRepository implements IOrderRepository {
  private key = 'orders'

  async findAll(sellerId: string): Promise<Order[]> {
    return getStored<Order>(this.key, DEMO_ORDERS)
      .filter(o => o.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  async findById(id: string): Promise<Order | null> {
    return getStored<Order>(this.key, DEMO_ORDERS).find(o => o.id === id) ?? null
  }
  async findByCustomerId(customerId: string): Promise<Order[]> {
    return getStored<Order>(this.key, DEMO_ORDERS).filter(o => o.customerId === customerId)
  }
  async findByProductId(productId: string): Promise<Order[]> {
    return getStored<Order>(this.key, DEMO_ORDERS).filter(o => o.productId === productId)
  }
  async create(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const all = getStored<Order>(this.key, DEMO_ORDERS)
    const order: Order = { ...data, id: genId('order'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, order])
    return order
  }
  async update(id: string, data: Partial<Order>): Promise<Order> {
    const all = getStored<Order>(this.key, DEMO_ORDERS)
    const updated = all.map(o => o.id === id ? { ...o, ...data } : o)
    setStored(this.key, updated)
    return updated.find(o => o.id === id)!
  }
}

// ─── CUSTOMER REPO ───────────────────────────────────────────
export class DemoCustomerRepository implements ICustomerRepository {
  private key = 'customers'

  async findAll(sellerId: string): Promise<Customer[]> {
    return getStored<Customer>(this.key, DEMO_CUSTOMERS)
      .filter(c => c.sellerId === sellerId)
      .sort((a, b) => b.totalSpend - a.totalSpend)
  }
  async findById(id: string): Promise<Customer | null> {
    return getStored<Customer>(this.key, DEMO_CUSTOMERS).find(c => c.id === id) ?? null
  }
  async findByEmail(sellerId: string, email: string): Promise<Customer | null> {
    return getStored<Customer>(this.key, DEMO_CUSTOMERS)
      .find(c => c.sellerId === sellerId && c.email.toLowerCase() === email.toLowerCase()) ?? null
  }
  async create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const all = getStored<Customer>(this.key, DEMO_CUSTOMERS)
    const customer: Customer = { ...data, id: genId('cust'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, customer])
    return customer
  }
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const all = getStored<Customer>(this.key, DEMO_CUSTOMERS)
    const updated = all.map(c => c.id === id ? { ...c, ...data } : c)
    setStored(this.key, updated)
    return updated.find(c => c.id === id)!
  }
}

// ─── COUPON REPO ─────────────────────────────────────────────
export class DemoCouponRepository implements ICouponRepository {
  private key = 'coupons'

  async findBySellerId(sellerId: string): Promise<Coupon[]> {
    return getStored<Coupon>(this.key, DEMO_COUPONS).filter(c => c.sellerId === sellerId)
  }
  async findByCode(sellerId: string, code: string): Promise<Coupon | null> {
    return getStored<Coupon>(this.key, DEMO_COUPONS)
      .find(c => c.sellerId === sellerId && c.code.toUpperCase() === code.toUpperCase()) ?? null
  }
  async create(data: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
    const all = getStored<Coupon>(this.key, DEMO_COUPONS)
    const coupon: Coupon = { ...data, id: genId('coupon'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, coupon])
    return coupon
  }
  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const all = getStored<Coupon>(this.key, DEMO_COUPONS)
    const updated = all.map(c => c.id === id ? { ...c, ...data } : c)
    setStored(this.key, updated)
    return updated.find(c => c.id === id)!
  }
  async incrementUse(id: string): Promise<void> {
    const all = getStored<Coupon>(this.key, DEMO_COUPONS)
    setStored(this.key, all.map(c => c.id === id ? { ...c, usedCount: c.usedCount + 1 } : c))
  }
}

// ─── FILE ASSET REPO ─────────────────────────────────────────
export class DemoFileAssetRepository implements IFileAssetRepository {
  private key = 'file_assets'

  async findBySellerId(sellerId: string): Promise<FileAsset[]> {
    return getStored<FileAsset>(this.key, DEMO_FILE_ASSETS).filter(f => f.sellerId === sellerId)
  }
  async findByProductId(productId: string): Promise<FileAsset[]> {
    return getStored<FileAsset>(this.key, DEMO_FILE_ASSETS).filter(f => f.productId === productId)
  }
  async findById(id: string): Promise<FileAsset | null> {
    return getStored<FileAsset>(this.key, DEMO_FILE_ASSETS).find(f => f.id === id) ?? null
  }
  async create(data: Omit<FileAsset, 'id' | 'createdAt' | 'downloadCount'>): Promise<FileAsset> {
    const all = getStored<FileAsset>(this.key, DEMO_FILE_ASSETS)
    const asset: FileAsset = { ...data, id: genId('file'), downloadCount: 0, createdAt: new Date().toISOString() }
    setStored(this.key, [...all, asset])
    return asset
  }
  async delete(id: string): Promise<void> {
    setStored(this.key, getStored<FileAsset>(this.key, DEMO_FILE_ASSETS).filter(f => f.id !== id))
  }
  async incrementDownload(id: string): Promise<void> {
    const all = getStored<FileAsset>(this.key, DEMO_FILE_ASSETS)
    setStored(this.key, all.map(f => f.id === id ? { ...f, downloadCount: f.downloadCount + 1 } : f))
  }
}

// ─── DOWNLOAD GRANT REPO ─────────────────────────────────────
export class DemoDownloadGrantRepository implements IDownloadGrantRepository {
  private key = 'download_grants'

  async findByToken(token: string): Promise<DownloadGrant | null> {
    return getStored<DownloadGrant>(this.key, DEMO_DOWNLOAD_GRANTS).find(d => d.token === token) ?? null
  }
  async findByOrderId(orderId: string): Promise<DownloadGrant[]> {
    return getStored<DownloadGrant>(this.key, DEMO_DOWNLOAD_GRANTS).filter(d => d.orderId === orderId)
  }
  async create(data: Omit<DownloadGrant, 'id' | 'createdAt'>): Promise<DownloadGrant> {
    const all = getStored<DownloadGrant>(this.key, DEMO_DOWNLOAD_GRANTS)
    const grant: DownloadGrant = { ...data, id: genId('dl'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, grant])
    return grant
  }
  async incrementDownload(id: string): Promise<void> {
    const all = getStored<DownloadGrant>(this.key, DEMO_DOWNLOAD_GRANTS)
    setStored(this.key, all.map(d => d.id === id ? { ...d, downloadCount: d.downloadCount + 1 } : d))
  }
}

// ─── SUBSCRIPTION REPO ───────────────────────────────────────
export class DemoSubscriptionRepository implements ISubscriptionRepository {
  private key = 'subscriptions'

  async findBySellerId(sellerId: string): Promise<Subscription[]> {
    return getStored<Subscription>(this.key, DEMO_SUBSCRIPTIONS).filter(s => s.sellerId === sellerId)
  }
  async findByCustomerId(customerId: string): Promise<Subscription[]> {
    return getStored<Subscription>(this.key, DEMO_SUBSCRIPTIONS).filter(s => s.customerId === customerId)
  }
  async create(data: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const all = getStored<Subscription>(this.key, DEMO_SUBSCRIPTIONS)
    const sub: Subscription = { ...data, id: genId('sub'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, sub])
    return sub
  }
  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const all = getStored<Subscription>(this.key, DEMO_SUBSCRIPTIONS)
    const updated = all.map(s => s.id === id ? { ...s, ...data } : s)
    setStored(this.key, updated)
    return updated.find(s => s.id === id)!
  }
}

// ─── ANALYTICS REPO ──────────────────────────────────────────
export class DemoAnalyticsRepository implements IAnalyticsRepository {
  private key = 'analytics'

  async findBySellerId(sellerId: string, opts?: { days?: number }): Promise<AnalyticsEvent[]> {
    let events = getStored<AnalyticsEvent>(this.key, DEMO_ANALYTICS_EVENTS)
      .filter(e => e.sellerId === sellerId)
    if (opts?.days) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - opts.days)
      events = events.filter(e => new Date(e.createdAt) >= cutoff)
    }
    return events
  }
  async create(data: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent> {
    const all = getStored<AnalyticsEvent>(this.key, DEMO_ANALYTICS_EVENTS)
    const event: AnalyticsEvent = { ...data, id: genId('evt'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, event])
    return event
  }
}

// ─── EMAIL LOG REPO ──────────────────────────────────────────
export class DemoEmailLogRepository implements IEmailLogRepository {
  private key = 'email_logs'

  async findBySellerId(sellerId: string): Promise<EmailLog[]> {
    return getStored<EmailLog>(this.key, DEMO_EMAIL_LOGS)
      .filter(e => e.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  async create(data: Omit<EmailLog, 'id' | 'createdAt'>): Promise<EmailLog> {
    const all = getStored<EmailLog>(this.key, DEMO_EMAIL_LOGS)
    const log: EmailLog = { ...data, id: genId('email'), createdAt: new Date().toISOString() }
    setStored(this.key, [...all, log])
    return log
  }
}

// ─── PAYOUT REPO ─────────────────────────────────────────────
export class DemoPayoutRepository implements IPayoutRepository {
  private key = 'payouts'

  async findBySellerId(sellerId: string): Promise<PayoutRecord[]> {
    return getStored<PayoutRecord>(this.key, DEMO_PAYOUTS).filter(p => p.sellerId === sellerId)
  }
  async create(data: Omit<PayoutRecord, 'id'>): Promise<PayoutRecord> {
    const all = getStored<PayoutRecord>(this.key, DEMO_PAYOUTS)
    const payout: PayoutRecord = { ...data, id: genId('payout') }
    setStored(this.key, [...all, payout])
    return payout
  }
}

// ─── STOREFRONT REPO ─────────────────────────────────────────
export class DemoStorefrontRepository implements IStorefrontRepository {
  private key = 'storefronts'

  async findBySellerSlug(slug: string): Promise<Storefront | null> {
    return getStored<Storefront>(this.key, [DEMO_STOREFRONT]).find(s => s.slug === slug) ?? null
  }
  async findBySellerId(sellerId: string): Promise<Storefront | null> {
    return getStored<Storefront>(this.key, [DEMO_STOREFRONT]).find(s => s.sellerId === sellerId) ?? null
  }
  async upsert(data: Omit<Storefront, 'id'>): Promise<Storefront> {
    const all = getStored<Storefront>(this.key, [DEMO_STOREFRONT])
    const existing = all.find(s => s.sellerId === data.sellerId)
    if (existing) {
      const updated = all.map(s => s.sellerId === data.sellerId ? { ...s, ...data } : s)
      setStored(this.key, updated)
      return updated.find(s => s.sellerId === data.sellerId)!
    }
    const storefront: Storefront = { ...data, id: genId('store') }
    setStored(this.key, [...all, storefront])
    return storefront
  }
}

// ─── SINGLETON INSTANCES ─────────────────────────────────────
export const demoProductRepo = new DemoProductRepository()
export const demoOrderRepo = new DemoOrderRepository()
export const demoCustomerRepo = new DemoCustomerRepository()
export const demoCouponRepo = new DemoCouponRepository()
export const demoFileRepo = new DemoFileAssetRepository()
export const demoDownloadRepo = new DemoDownloadGrantRepository()
export const demoSubscriptionRepo = new DemoSubscriptionRepository()
export const demoAnalyticsRepo = new DemoAnalyticsRepository()
export const demoEmailRepo = new DemoEmailLogRepository()
export const demoPayoutRepo = new DemoPayoutRepository()
export const demoStorefrontRepo = new DemoStorefrontRepository()
