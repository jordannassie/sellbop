'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoOrderRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ShoppingBag } from 'lucide-react'
import type { Order } from '@/lib/domain/entities'

function statusV(s: string) { return s === 'completed' ? 'success' : s === 'refunded' ? 'warning' : s === 'failed' ? 'danger' : 'neutral' }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => { demoOrderRepo.findAll(DEMO_SELLER_PROFILE.id).then(setOrders) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Orders</h1>
        <p className="text-neutral-500 text-sm mt-1">{orders.length} total orders</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={32} />} title="No orders yet" description="Orders appear here after someone buys." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    {['Customer', 'Product', 'Amount', 'Type', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-neutral-900">{o.customerName}</p>
                        <p className="text-xs text-neutral-400">{o.customerEmail}</p>
                      </td>
                      <td className="px-6 py-3 text-neutral-700 max-w-[160px] truncate">{o.productName}</td>
                      <td className="px-6 py-3 font-semibold text-black">{formatCurrency(o.amount, o.currency)}</td>
                      <td className="px-6 py-3 text-neutral-500 capitalize text-xs">{o.productType.replace('_', ' ')}</td>
                      <td className="px-6 py-3"><Badge variant={statusV(o.status)}>{o.status}</Badge></td>
                      <td className="px-6 py-3 text-neutral-400 text-xs">{formatDate(o.createdAt)}</td>
                      <td className="px-6 py-3"><Link href={`/dashboard/orders/${o.id}`} className="text-xs text-neutral-500 hover:text-black">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
