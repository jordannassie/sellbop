'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const productId = searchParams.get('productId')
  const email = searchParams.get('email')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  // This page is shown after confirmed payment via Stripe webhook
  // The session_id param can be verified for Stripe sessions
  const sessionId = searchParams.get('session_id')
  const hasStripeSession = !!sessionId
  const hasDirectAccess = !!(orderId && productId && email)

  async function handleDownload() {
    if (!orderId || !productId || !email) return
    setDownloading(true)
    setDownloadError('')
    try {
      const res = await fetch(
        `/api/download?orderId=${orderId}&productId=${productId}&email=${encodeURIComponent(email)}`
      )
      const data = await res.json()
      if (!res.ok || !data.download_url) throw new Error(data.error ?? 'Download failed.')
      window.location.href = data.download_url
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  if (!hasDirectAccess && !hasStripeSession) {
    return (
      <div className="text-center">
        <p className="text-neutral-500 mb-4">No order information found.</p>
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    )
  }

  if (hasStripeSession && !hasDirectAccess) {
    // After real Stripe payment — webhook creates the order
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Payment successful!</h1>
        <p className="text-neutral-500 mb-2">
          Your purchase is confirmed. Check your email for a download link.
        </p>
        <p className="text-xs text-neutral-400 mb-8">
          Downloads are sent via email after payment verification.
        </p>
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Download size={28} className="text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-black mb-2">You&apos;re all set!</h1>
      <p className="text-neutral-500 mb-2">
        Your download is ready.
      </p>
      {email && (
        <p className="text-xs text-neutral-400 mb-8">
          A receipt and download link have been sent to <strong>{email}</strong>.
        </p>
      )}
      {hasDirectAccess && (
        <>
          <Button onClick={handleDownload} size="lg" loading={downloading} className="mb-4">
            <Download size={16} /> Download Now
          </Button>
          {downloadError && <p className="text-xs text-red-500 mt-2">{downloadError}</p>}
        </>
      )}
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
