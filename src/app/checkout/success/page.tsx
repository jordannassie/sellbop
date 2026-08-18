'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react'

interface CheckoutStatus {
  status: 'processing' | 'completed'
  productTitle?: string | null
  buyerEmail?: string | null
  accessUrl?: string
  emailSent?: boolean
  emailSimulated?: boolean
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<CheckoutStatus>({ status: 'processing' })
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let attempts = 0

    async function poll() {
      if (!sessionId) return
      while (!cancelled && attempts < 20) {
        attempts += 1
        try {
          const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`)
          const data = await res.json()
          if (data.status === 'completed') {
            setStatus(data)
            return
          }
        } catch {
          // retry
        }
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="text-center">
        <p className="text-neutral-500 mb-4">No order information found.</p>
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    )
  }

  if (status.status === 'processing') {
    return (
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">Finishing your purchase…</h1>
        <p className="text-sm text-neutral-500">This usually takes just a moment.</p>
      </div>
    )
  }

  const emailLine = status.emailSent
    ? `Your receipt and access link were sent to ${status.buyerEmail}.`
    : 'Your purchase is complete. We weren\'t able to email your receipt yet, but you can access your product below.'

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={28} className="text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-black mb-2">Purchase complete</h1>
      {status.productTitle && (
        <p className="text-neutral-700 font-medium mb-2">{status.productTitle}</p>
      )}
      {status.accessUrl && (
        <a href={status.accessUrl} className="inline-block mb-4">
          <Button size="lg">
            Access Your Product <ExternalLink size={16} />
          </Button>
        </a>
      )}
      <p className="text-sm text-neutral-500 mb-2">{emailLine}</p>
      {status.emailSimulated && (
        <p className="text-xs text-neutral-400 mb-4">Email delivery is simulated in development.</p>
      )}
      <div className="mt-6 space-y-2">
        <Link href="/login?next=/dashboard/library">
          <Button variant="secondary" className="w-full">Sign in to save in Library</Button>
        </Link>
        <Link href="/purchases" className="block text-xs text-neutral-400 hover:text-black">
          Find my purchases by email
        </Link>
        {resendMessage && <p className="text-xs text-neutral-500">{resendMessage}</p>}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/"><SellBopLogo size="lg" /></Link>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-16">
        <div className="max-w-md w-full">
          <Suspense fallback={<div className="h-48 bg-neutral-100 rounded-2xl animate-pulse" />}>
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
