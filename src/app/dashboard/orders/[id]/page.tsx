'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoOrderRepo } from '@/lib/adapters/demo/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Order } from '@/lib/domain/entities'

function statusV(s: string) { return s === 'completed' ? 'success' : s === 'refunded' ? 'warning' : s === 'failed' ? 'danger' : 'neutral' }

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => { params.then(({ id }) => demoOrderRepo.findById(id).then(setOrder)) }, [params])

  if (!order) return <div className="text-sm text-neutral-500 py-8">Loading…</div>

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-6 transition-colors">
        <ArrowLeft size={15} />Back to Orders
      </button>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Order #{order.id.slice(0, 8)}</h1>
        <Badge variant={statusV(order.status)}>{order.status}</Badge>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Product', order.productName],
              ['Type', order.productType.replace('_', ' ')],
              ['Amount', formatCurrency(order.amount, order.currency)],
              ['Discount', order.discountAmount > 0 ? `${formatCurrency(order.discountAmount)} (${order.couponCode})` : '—'],
              ['Payment Status', order.paymentStatus],
              ['Date', formatDate(order.createdAt, 'long')],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{label}</span>
                <span className="font-medium text-neutral-900 capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[['Name', order.customerName], ['Email', order.customerEmail]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{l}</span>
                <span className="font-medium text-neutral-900">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => alert('Demo: Receipt would be resent.')}>Resend Receipt</Button>
            <Button size="sm" variant="secondary" onClick={() => alert('Demo: Refund would be initiated via Stripe.')}>Initiate Refund</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
