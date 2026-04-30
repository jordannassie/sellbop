'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoOrderRepo, demoCustomerRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Repeat2,
  ShoppingBag,
  Tag,
  Users,
} from 'lucide-react'
import type { Order } from '@/lib/domain/entities'

interface SectionCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  stat?: string
  statLabel?: string
}

function statusVariant(status: string) {
  return status === 'completed' ? 'success' : status === 'refunded' ? 'warning' : status === 'failed' ? 'danger' : 'neutral'
}

export default function SalesSectionPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customerCount, setCustomerCount] = useState(0)

  useEffect(() => {
    const sid = DEMO_SELLER_PROFILE.id
    Promise.all([
      demoOrderRepo.findAll(sid),
      demoCustomerRepo.findAll(sid),
    ]).then(([o, c]) => {
      setOrders(o)
      setCustomerCount(c.length)
    })
  }, [])

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0)
  const recentOrders = orders.slice(0, 6)

  const CARDS: SectionCard[] = [
    {
      title: 'Orders',
      description: 'View and manage all customer orders.',
      href: '/dashboard/orders',
      icon: ShoppingBag,
      stat: paidOrders.length.toString(),
      statLabel: 'paid orders',
    },
    {
      title: 'Customers',
      description: 'See who has purchased from your store.',
      href: '/dashboard/customers',
      icon: Users,
      stat: customerCount.toString(),
      statLabel: 'customers',
    },
    {
      title: 'Subscriptions',
      description: 'Manage recurring subscriptions and memberships.',
      href: '/dashboard/subscriptions',
      icon: Repeat2,
      stat: '',
      statLabel: 'active',
    },
    {
      title: 'Analytics',
      description: 'Track views, conversion, and revenue over time.',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      title: 'Discounts',
      description: 'Create and manage discount codes.',
      href: '/dashboard/discounts',
      icon: Tag,
    },
    {
      title: 'Payouts',
      description: 'Track your earnings and payout history.',
      href: '/dashboard/payouts',
      icon: DollarSign,
      stat: formatCurrency(totalRevenue),
      statLabel: 'total revenue',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Sales</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Orders, customers, subscriptions, and revenue.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Total Orders', value: paidOrders.length.toString() },
          { label: 'Customers', value: customerCount.toString() },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {CARDS.map(card => (
          <Link key={card.href} href={card.href}>
            <div className="group rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <card.icon size={17} className="text-neutral-600" />
                </div>
                <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-neutral-600 transition-colors" />
              </div>
              <p className="font-semibold text-sm text-black">{card.title}</p>
              <p className="text-xs text-neutral-500 mt-1 mb-3 leading-relaxed">{card.description}</p>
              {card.stat !== undefined && (
                <p className="text-xs text-neutral-400">
                  <span className="font-bold text-black">{card.stat}</span> {card.statLabel}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button size="xs" variant="ghost">View all →</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-400">
              No orders yet. Share your store to get your first sale.
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {recentOrders.map(order => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                  <div className="flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{order.customerEmail}</p>
                      <p className="text-xs text-neutral-400">
                        {order.productName} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                      <span className="text-sm font-semibold text-black">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-700">Next:</span> Connect Stripe to process real payments and see live revenue.
        Subscription management and payout tracking will activate automatically.
      </div>
    </div>
  )
}
