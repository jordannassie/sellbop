'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'

interface OrderRow {
  id: string
  buyer_email: string | null
  buyer_name: string | null
  total_cents: number
  platform_fee_cents: number
  payment_status: string
  refund_status: string
  created_at: string
  product_title_snapshot: string | null
  currency: string
}

function statusVariant(status: string) {
  if (status === 'paid') return 'success'
  if (status === 'refunded') return 'warning'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

export default function SalesPage() {
  const { session } = useAuth()
  const { activeStoreId, storeVersion } = useUserStore()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !isSupabaseConfigured() || !activeStoreId) { setLoading(false); return }
    setLoading(true)
    fetch('/api/orders', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(data => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [session, activeStoreId, storeVersion])

  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total_cents ?? 0), 0) / 100
  const totalFees = paidOrders.reduce((s, o) => s + (o.platform_fee_cents ?? 0), 0) / 100
  const netRevenue = totalRevenue - totalFees

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Sales</h1>
        <p className="mt-1 text-sm text-neutral-500">All orders from your customers.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: 'Gross Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Platform Fees', value: formatCurrency(totalFees) },
          { label: 'Net Revenue', value: formatCurrency(netRevenue) },
          { label: 'Orders', value: paidOrders.length.toString() },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{stat.label}</p>
            {loading ? (
              <div className="h-6 w-20 bg-neutral-100 rounded animate-pulse mt-1" />
            ) : (
              <p className="mt-1 text-xl font-bold text-black">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-neutral-50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded w-48" />
                    <div className="h-3 bg-neutral-100 rounded w-32" />
                  </div>
                  <div className="h-6 w-16 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShoppingBag size={32} className="mx-auto mb-3 text-neutral-200" />
              <p className="text-sm font-medium text-neutral-700 mb-1">No orders yet</p>
              <p className="text-xs text-neutral-400">
                Orders will appear here after your first sale. Make sure at least one product is live and shared.
              </p>
            </div>
          ) : (
            <>
              {/* Table header (desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 border-b border-neutral-100 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                <div className="col-span-4">Customer</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Date</div>
              </div>
              <div className="divide-y divide-neutral-50">
                {orders.map(order => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="sm:grid sm:grid-cols-12 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 sm:flex-none">
                      <div className="sm:col-span-4 min-w-0 flex-1 sm:flex-none">
                        <p className="text-sm font-medium text-neutral-900 truncate">{order.buyer_email ?? '—'}</p>
                        {order.buyer_name && <p className="text-xs text-neutral-400 truncate sm:hidden">{order.buyer_name}</p>}
                      </div>
                      <div className="sm:col-span-3 hidden sm:block">
                        <p className="text-sm text-neutral-600 truncate">{order.product_title_snapshot ?? '—'}</p>
                      </div>
                      <div className="sm:col-span-2 shrink-0">
                        <p className="text-sm font-semibold text-black">{formatCurrency(order.total_cents ?? 0)}</p>
                      </div>
                      <div className="sm:col-span-2 shrink-0">
                        <Badge variant={statusVariant(order.payment_status)}>{order.payment_status}</Badge>
                      </div>
                      <div className="sm:col-span-1 hidden sm:block">
                        <p className="text-xs text-neutral-400">{timeAgo(order.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Supabase is not configured. Sales data is unavailable until connected.
        </div>
      )}
    </div>
  )
}
