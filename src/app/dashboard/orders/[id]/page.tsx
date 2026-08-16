'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderDetail {
  id: string
  buyer_email: string | null
  buyer_name: string | null
  total_cents: number
  subtotal_cents: number
  platform_fee_cents: number
  discount_cents: number
  currency: string
  payment_status: string
  refund_status: string
  status: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  product_title_snapshot: string | null
  created_at: string
  notes: string | null
}

function statusVariant(status: string) {
  if (status === 'paid') return 'success'
  if (status === 'refunded') return 'warning'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/orders/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.order) setOrder(data.order); else router.push('/dashboard/sales') })
        .catch(() => router.push('/dashboard/sales'))
        .finally(() => setLoading(false))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRefund() {
    if (!order) return
    if (!confirm('Request a refund for this order?')) return
    setRefunding(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, { method: 'POST' })
      const data = await res.json()
      if (data.stripe_required) {
        toast.error('Stripe must be connected to process refunds.')
      } else if (!res.ok) {
        throw new Error(data.error ?? 'Refund failed.')
      } else {
        toast.success('Refund initiated.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refund failed.')
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-32 bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-40 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!order) return null

  const netAmount = (order.total_cents - order.platform_fee_cents) / 100

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/sales"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Sales
      </Link>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">{order.product_title_snapshot ?? 'Order'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(order.payment_status)}>{order.payment_status}</Badge>
            {order.refund_status !== 'none' && (
              <Badge variant="warning">{order.refund_status.replace('_', ' ')}</Badge>
            )}
          </div>
        </div>
        <p className="text-2xl font-bold text-black shrink-0">
          {formatCurrency(order.total_cents / 100)}
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Email</span>
              <span className="font-medium">{order.buyer_email ?? '—'}</span>
            </div>
            {order.buyer_name && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Name</span>
                <span className="font-medium">{order.buyer_name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatCurrency(order.subtotal_cents / 100)}</span>
            </div>
            {order.discount_cents > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>−{formatCurrency(order.discount_cents / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Sellbop fee</span>
              <span>−{formatCurrency(order.platform_fee_cents / 100)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-100">
              <span>Your net</span>
              <span>{formatCurrency(netAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Order ID</span>
              <span className="font-mono text-xs">{order.id.slice(0, 12)}…</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Date</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.stripe_payment_intent_id && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Stripe PI</span>
                <span className="font-mono text-xs">{order.stripe_payment_intent_id.slice(0, 14)}…</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund action */}
        {order.payment_status === 'paid' && order.refund_status === 'none' && (
          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={handleRefund}
              loading={refunding}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Issue Refund
            </Button>
            <p className="text-xs text-neutral-400 mt-1">Requires Stripe to be connected.</p>
          </div>
        )}
      </div>
    </div>
  )
}
