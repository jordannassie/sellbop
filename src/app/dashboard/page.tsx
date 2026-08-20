'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { GettingStartedCard } from '@/components/dashboard/getting-started-card'
import { StripePaymentsCard } from '@/components/dashboard/stripe-payments-card'
import { StripeLiveProductsWarning } from '@/components/dashboard/stripe-live-products-warning'
import { PartnerTermsAcceptance } from '@/components/dashboard/partner-terms-acceptance'
import { PartnerEarningsCard } from '@/components/dashboard/partner-earnings-card'
import { ClaudeEcomCard } from '@/components/dashboard/claude-ecom-card'
import { isSupabaseConfigured } from '@/lib/env'

interface OrderRow {
  id: string
  buyer_email: string | null
  total_cents: number
  payment_status: string
  created_at: string
  product_title_snapshot: string | null
}

interface ProductRow {
  id: string
  title: string
  slug: string
  price_cents: number | null
  is_live: boolean
  sales_count: number
  cover_image_url: string | null
  image_url: string | null
}

function statusVariant(status: string) {
  return status === 'paid' || status === 'completed' ? 'success'
    : status === 'refunded' ? 'warning'
    : status === 'failed' ? 'danger'
    : 'neutral'
}

export default function DashboardOverview() {
  const { session, account } = useAuth()
  const { store, stores, activeStoreId, storeVersion, loading: storeLoading } = useUserStore()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerContext, setPartnerContext] = useState<{
    partnershipId: string
    partnerShareBps: number
    termsAccepted: boolean
    isPartnerOwner: boolean
  } | null>(null)

  const firstName = session?.name?.split(' ')[0] ?? session?.email?.split('@')[0] ?? 'there'
  const hasStore = !!(account?.hasStore || store)

  // Buyer-only users go straight to Library
  useEffect(() => {
    if (storeLoading) return
    if (!hasStore) {
      router.replace('/dashboard/library')
    }
  }, [storeLoading, hasStore, router])

  useEffect(() => {
    if (!isSupabaseConfigured() || !activeStoreId) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      fetch('/api/orders', { cache: 'no-store' }).then(r => r.ok ? r.json() : { orders: [] }),
      fetch('/api/products', { cache: 'no-store' }).then(r => r.ok ? r.json() : { products: [] }),
      fetch('/api/partnerships/context', { cache: 'no-store' }).then(r => r.ok ? r.json() : { partnership: null }),
    ]).then(([ordersData, productsData, partnerData]) => {
      setOrders(ordersData.orders ?? [])
      setProducts(productsData.products ?? [])
      if (partnerData.partnership?.isPartnerOwner && partnerData.terms) {
        setPartnerContext({
          partnershipId: partnerData.partnership.id,
          partnerShareBps: partnerData.terms.partnerShareBps,
          termsAccepted: !!partnerData.terms.acceptedAt,
          isPartnerOwner: true,
        })
      } else {
        setPartnerContext(null)
      }
    }).catch(() => {
      setOrders([])
      setProducts([])
    }).finally(() => setLoading(false))
  }, [activeStoreId, storeVersion])

  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total_cents ?? 0), 0) / 100
  const totalSales = paidOrders.length
  const publishedProducts = products.filter(p => p.is_live).length
  const uniqueCustomers = new Set(paidOrders.map(o => o.buyer_email).filter(Boolean)).size
  const recentOrders = orders.slice(0, 6)
  const topProducts = [...products].sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0)).slice(0, 4)

  const storeSlug = store?.slug
  const activeSummary = stores.find(s => s.id === activeStoreId)
  const isUnpublishedPartner = !!(activeSummary?.isPartnerShop && activeSummary.partnershipStatus !== 'active')
  const showPartnerClaimCard = activeSummary?.isPartnerShop
    && (activeSummary.partnershipStatus === 'claimed' || activeSummary.partnershipStatus === 'invited')
    && !store?.stripe_charges_enabled

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Welcome back, {firstName}.</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {publishedProducts > 0
              ? `${publishedProducts} product${publishedProducts === 1 ? '' : 's'} live · Keep sharing your links.`
              : 'Create your first product to start selling.'}
          </p>
        </div>
        {storeSlug && !isUnpublishedPartner && (
          <Link href={`/store/${storeSlug}`} target="_blank">
            <Button size="sm" variant="brand" className="font-semibold">
              <ExternalLink size={13} /> View Store
            </Button>
          </Link>
        )}
      </div>

      {partnerContext && !partnerContext.termsAccepted && (
        <PartnerTermsAcceptance
          partnershipId={partnerContext.partnershipId}
          partnerShareBps={partnerContext.partnerShareBps}
          termsAccepted={partnerContext.termsAccepted}
        />
      )}

      {activeSummary?.isPartnerShop && <PartnerEarningsCard />}

      <ClaudeEcomCard />

      {showPartnerClaimCard && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-black">SellBop Partner Shop</p>
          <p className="text-sm text-neutral-500 mt-1">
            Your Shop has been claimed. Connect Stripe to prepare for launch.
          </p>
          <Link href="/dashboard/payouts" className="inline-block mt-3">
            <Button size="sm" variant="brand">Connect Stripe</Button>
          </Link>
        </div>
      )}

      <StripePaymentsCard />
      <StripeLiveProductsWarning liveProductCount={publishedProducts} />
      <GettingStartedCard />

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Link href="/dashboard/products/new">
          <div className="group rounded-2xl border-2 border-black bg-black p-6 text-white hover:bg-neutral-800 transition-colors cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Package size={20} className="text-white" />
            </div>
            <p className="font-bold text-base mb-1">Create a product</p>
            <p className="text-white/60 text-sm mb-4">Upload your digital file and start selling.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
              Get started <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/sales">
          <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <ShoppingBag size={20} className="text-neutral-600" />
            </div>
            <p className="font-bold text-base text-black mb-1">View sales</p>
            <p className="text-neutral-500 text-sm mb-4">Orders, revenue, and customer details.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600 group-hover:text-black transition-colors">
              See sales <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/payouts">
          <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <DollarSign size={20} className="text-neutral-600" />
            </div>
            <p className="font-bold text-base text-black mb-1">Payouts</p>
            <p className="text-neutral-500 text-sm mb-4">Connect Stripe to receive your earnings.</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600 group-hover:text-black transition-colors">
              Setup payouts <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, href: '/dashboard/sales' },
          { label: 'Total Sales', value: totalSales.toString(), icon: ShoppingBag, href: '/dashboard/sales' },
          { label: 'Products', value: publishedProducts.toString(), icon: Package, href: '/dashboard/products' },
          { label: 'Customers', value: uniqueCustomers.toString(), icon: Users, href: '/dashboard/customers' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={13} className="text-neutral-400" />
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-neutral-100 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-black">{stat.value}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders + Top products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/dashboard/sales"><Button size="xs" variant="ghost">View all →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ShoppingBag size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No orders yet</p>
                <p className="text-xs text-neutral-400 mb-4">Orders will appear here after your first sale.</p>
                <Link href="/dashboard/products/new">
                  <Button size="sm" variant="secondary">Create a product</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentOrders.map(order => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{order.buyer_email}</p>
                        <p className="text-xs text-neutral-400">{order.product_title_snapshot ?? '—'} · {timeAgo(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusVariant(order.payment_status)}>{order.payment_status}</Badge>
                        <span className="text-sm font-semibold text-black">{formatCurrency((order.total_cents ?? 0) / 100)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <Link href="/dashboard/products"><Button size="xs" variant="ghost">Manage →</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Package size={28} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-sm font-medium text-neutral-700 mb-1">No products yet</p>
                <p className="text-xs text-neutral-400 mb-4">Create your first product to start selling.</p>
                <Link href="/dashboard/products/new">
                  <Button size="sm">Create Product</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {topProducts.map(p => {
                  const coverUrl = p.cover_image_url ?? p.image_url
                  return (
                  <Link key={p.id} href={`/dashboard/products/${p.id}`}>
                    <div className="px-6 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 flex items-center justify-center">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverUrl} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{p.title}</p>
                        <p className="text-xs text-neutral-400">{formatCurrency((p.price_cents ?? 0) / 100)} · {p.sales_count ?? 0} sales</p>
                      </div>
                      <Badge variant={p.is_live ? 'success' : 'neutral'}>
                        {p.is_live ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
