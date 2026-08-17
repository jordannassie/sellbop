'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Download } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'

interface CustomerRow {
  email: string
  name: string
  total_spend_cents: number
  purchase_count: number
  last_purchase_at: string
  order_ids: string[]
}

export default function CustomersPage() {
  const { session } = useAuth()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !isSupabaseConfigured()) { setLoading(false); return }
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : { customers: [] })
      .then(data => setCustomers(data.customers ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [session])

  function handleExportCSV() {
    if (customers.length === 0) return
    const headers = ['Email', 'Name', 'Total Spend', 'Purchases', 'Last Purchase']
    const rows = customers.map(c => [
      c.email,
      c.name,
      `$${(c.total_spend_cents / 100).toFixed(2)}`,
      c.purchase_count,
      c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString() : '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sellbop-customers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} have purchased from you.
          </p>
        </div>
        {customers.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download size={13} /> Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-neutral-50">
              {[1,2,3,4].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded w-48" />
                    <div className="h-3 bg-neutral-100 rounded w-32" />
                  </div>
                  <div className="h-5 w-16 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users size={32} className="mx-auto mb-3 text-neutral-200" />
              <p className="text-sm font-medium text-neutral-700 mb-1">No customers yet</p>
              <p className="text-xs text-neutral-400">
                Your customers will appear here after their first purchase.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 border-b border-neutral-100 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                <div className="col-span-4">Customer</div>
                <div className="col-span-2">Purchases</div>
                <div className="col-span-3">Total Spent</div>
                <div className="col-span-3">Last Purchase</div>
              </div>
              <div className="divide-y divide-neutral-50">
                {customers.map(c => (
                  <div key={c.email} className="sm:grid sm:grid-cols-12 sm:gap-4 px-4 sm:px-6 py-3 flex items-center gap-3 sm:flex-none">
                    <div className="sm:col-span-4 flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500 flex-shrink-0">
                        {(c.name?.charAt(0) ?? c.email.charAt(0)).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{c.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{c.email}</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2 hidden sm:block">
                      <p className="text-sm text-neutral-600">{c.purchase_count}</p>
                    </div>
                    <div className="sm:col-span-3 shrink-0">
                      <p className="text-sm font-semibold text-black">{formatCurrency(c.total_spend_cents)}</p>
                    </div>
                    <div className="sm:col-span-3 hidden sm:block">
                      <p className="text-xs text-neutral-400">{timeAgo(c.last_purchase_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
