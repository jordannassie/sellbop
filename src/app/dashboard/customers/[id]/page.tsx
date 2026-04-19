'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoCustomerRepo, demoOrderRepo } from '@/lib/adapters/demo/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import type { Customer, Order } from '@/lib/domain/entities'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    params.then(({ id }) => {
      demoCustomerRepo.findById(id).then(c => {
        setCustomer(c)
        if (c) demoOrderRepo.findByCustomerId(c.id).then(setOrders)
      })
    })
  }, [params])

  if (!customer) return <div className="text-sm text-neutral-500 py-8">Loading…</div>

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-6">
        <ArrowLeft size={15} />Back to Customers
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">{customer.name}</h1>
        <p className="text-neutral-500 text-sm">{customer.email}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['Total Spend', formatCurrency(customer.totalSpend)], ['Purchases', customer.purchaseCount.toString()], ['Customer Since', formatDate(customer.createdAt)]].map(([l, v]) => (
          <div key={l} className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{l}</p>
            <p className="font-semibold text-black">{v}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-50">
            {orders.map(o => (
              <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{o.productName}</p>
                  <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={o.status === 'completed' ? 'success' : 'neutral'}>{o.status}</Badge>
                  <span className="text-sm font-semibold">{formatCurrency(o.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
