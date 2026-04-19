'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { demoOrderRepo, demoDownloadRepo, demoProductRepo } from '@/lib/adapters/demo/repositories'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Check, Download, ExternalLink } from 'lucide-react'
import type { Order, Product, DownloadGrant } from '@/lib/domain/entities'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('orderId')
  const productId = params.get('productId')
  const [order, setOrder] = useState<Order | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [grants, setGrants] = useState<DownloadGrant[]>([])

  useEffect(() => {
    if (orderId) demoOrderRepo.findById(orderId).then(setOrder)
    if (productId) demoProductRepo.findById(productId).then(setProduct)
    if (orderId) demoDownloadRepo.findByOrderId(orderId).then(setGrants)
  }, [orderId, productId])

  if (!order || !product) {
    return (
      <div className="text-center py-20">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
        <Check size={24} className="text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-black mb-2">Payment confirmed!</h1>
      <p className="text-neutral-500 mb-2">Thank you, {order.customerName}. Your order is complete.</p>
      <p className="text-xs text-neutral-400 mb-8">A receipt has been sent to <strong>{order.customerEmail}</strong></p>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-left mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-black">{product.name}</p>
          <p className="text-sm font-bold text-black">{formatCurrency(order.amount)}</p>
        </div>
        <p className="text-xs text-neutral-500 capitalize">{product.productType.replace('_', ' ')}</p>
      </div>

      {/* Digital download */}
      {(product.productType === 'digital_download' || product.productType === 'bundle') && grants.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-black mb-3">Your downloads are ready</h2>
          <div className="space-y-2">
            {grants.map(g => (
              <button key={g.id} onClick={() => {
                alert(`Demo: This would open a secure download URL for token ${g.token}. In production, files are fetched from Supabase Storage via a signed URL.`)
              }} className="w-full flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-100 transition-colors text-left">
                <Download size={16} className="text-neutral-500 flex-shrink-0" />
                <span className="text-sm text-neutral-700">Download file {grants.indexOf(g) + 1}</span>
              </button>
            ))}
          </div>
          {product.confirmationMessage && (
            <p className="text-xs text-neutral-500 mt-3 text-left">{product.confirmationMessage}</p>
          )}
        </div>
      )}

      {/* Service offer */}
      {product.productType === 'service_offer' && product.externalUrl && (
        <div className="mb-6">
          <p className="text-sm text-neutral-700 mb-3">{product.confirmationMessage ?? 'Schedule your session using the link below.'}</p>
          <a href={product.externalUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full"><ExternalLink size={14} />Schedule Your Session</Button>
          </a>
        </div>
      )}

      {/* Subscription */}
      {product.productType === 'subscription' && (
        <div className="mb-6 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <p className="text-sm font-medium text-black mb-1">Subscription activated</p>
          <p className="text-xs text-neutral-500">{product.confirmationMessage ?? 'Check your email for access details and next steps.'}</p>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
        <Link href={`/store/${DEMO_SELLER_PROFILE_SLUG}`}><Button variant="ghost">More Products →</Button></Link>
      </div>
    </div>
  )
}

const DEMO_SELLER_PROFILE_SLUG = 'alexjohnson'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="text-sm font-bold text-black">Selli</Link>
        </div>
      </div>
      <Suspense fallback={<div className="text-center py-20 text-neutral-500 text-sm">Loading…</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
