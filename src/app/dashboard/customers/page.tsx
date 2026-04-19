'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoCustomerRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import type { Customer } from '@/lib/domain/entities'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  useEffect(() => { demoCustomerRepo.findAll(DEMO_SELLER_PROFILE.id).then(setCustomers) }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Customers</h1>
        <p className="text-neutral-500 text-sm mt-1">{customers.length} customers · {formatCurrency(customers.reduce((s, c) => s + c.totalSpend, 0))} total revenue</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Customers</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="No customers yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    {['Customer', 'Total Spend', 'Purchases', 'Last Purchase', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-neutral-900">{c.name}</p>
                        <p className="text-xs text-neutral-400">{c.email}</p>
                      </td>
                      <td className="px-6 py-3 font-semibold text-black">{formatCurrency(c.totalSpend)}</td>
                      <td className="px-6 py-3 text-neutral-700">{c.purchaseCount}</td>
                      <td className="px-6 py-3 text-neutral-500 text-xs">{c.lastPurchaseAt ? formatDate(c.lastPurchaseAt) : '—'}</td>
                      <td className="px-6 py-3"><Link href={`/dashboard/customers/${c.id}`} className="text-xs text-neutral-500 hover:text-black">View →</Link></td>
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
