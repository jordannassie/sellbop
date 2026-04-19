'use client'
import { useState, useEffect } from 'react'
import { demoPayoutRepo, demoOrderRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'
import type { PayoutRecord, Order } from '@/lib/domain/entities'

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const sid = DEMO_SELLER_PROFILE.id
    demoPayoutRepo.findBySellerId(sid).then(setPayouts)
    demoOrderRepo.findAll(sid).then(setOrders)
  }, [])

  const totalEarned = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.amount, 0)
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = payouts.find(p => p.status === 'pending')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Payouts</h1>
        <p className="text-neutral-500 text-sm mt-1">Connect Stripe to enable live payouts.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Earned" value={formatCurrency(totalEarned)} icon={<DollarSign size={14} />} />
        <StatCard label="Paid Out" value={formatCurrency(totalPaid)} icon={<DollarSign size={14} />} />
        <StatCard label="Next Payout" value={pending ? formatCurrency(pending.amount) : '—'} icon={<DollarSign size={14} />} />
      </div>

      {/* Payout method banner */}
      <div className="mb-6 p-5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
        <div>
          <p className="font-semibold text-black text-sm">Connect your bank account</p>
          <p className="text-xs text-neutral-500 mt-0.5">Stripe Connect is required for live payouts. Connect when you&apos;re ready to go live.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => alert('Demo: Would redirect to Stripe Connect onboarding.')}>Connect Stripe →</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {['Period', 'Orders', 'Amount', 'Status', 'Paid Date'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {payouts.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3 text-neutral-700 text-xs">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</td>
                  <td className="px-6 py-3 text-neutral-600">{p.ordersIncluded}</td>
                  <td className="px-6 py-3 font-semibold text-black">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-3"><Badge variant={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>{p.status}</Badge></td>
                  <td className="px-6 py-3 text-neutral-500 text-xs">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
