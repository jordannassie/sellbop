'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, ExternalLink, Loader2, Mail, Package, Shield } from 'lucide-react'
import { PublicHeader } from '@/components/marketing/public-header'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface AccessFile {
  id: string
  fileName: string
  fileType: string
  isLink: boolean
  downloadPath: string
}

interface AccessData {
  productTitle: string
  productSlug: string | null
  coverImageUrl: string | null
  sellerName: string
  sellerSlug: string | null
  supportEmail: string
  buyerEmail: string
  amountCents: number
  purchasedAt: string
  status: 'active' | 'revoked' | 'expired'
  files: AccessFile[]
}

export function PurchaseAccessPageClient({ token }: { token: string }) {
  const [data, setData] = useState<AccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    fetch(`/api/access/${token}`)
      .then(async res => {
        if (!res.ok) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then(json => {
        if (json) setData(json)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleResendReceipt() {
    setResending(true)
    setResendMessage('')
    try {
      const res = await fetch(`/api/access/${token}/resend-receipt`, { method: 'POST' })
      const json = await res.json()
      setResendMessage(json.message ?? 'Request submitted.')
    } catch {
      setResendMessage('Unable to resend right now. Please try again later.')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Package size={36} className="mx-auto mb-4 text-neutral-300" />
          <h1 className="text-2xl font-bold text-black mb-2">Access unavailable</h1>
          <p className="text-sm text-neutral-500 mb-6">
            This link may be invalid or no longer active. Try finding your purchases by email.
          </p>
          <Link href="/purchases">
            <Button variant="secondary">Find my purchases</Button>
          </Link>
        </div>
      </div>
    )
  }

  const revoked = data.status !== 'active'

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          {data.coverImageUrl && (
            <div className="aspect-[4/3] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.coverImageUrl} alt={data.productTitle} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Your purchase</p>
            <h1 className="text-2xl font-bold text-black mb-2">{data.productTitle}</h1>
            <p className="text-sm text-neutral-500 mb-1">
              by{' '}
              {data.sellerSlug ? (
                <Link href={`/${data.sellerSlug}`} className="hover:text-black">{data.sellerName}</Link>
              ) : data.sellerName}
            </p>
            <p className="text-xs text-neutral-400 mb-6">
              {data.amountCents === 0 ? 'Free' : formatCurrency(data.amountCents / 100)} · Purchased {formatDate(data.purchasedAt)}
            </p>

            {revoked ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Access to this product is no longer available. Contact{' '}
                <a href={`mailto:${data.supportEmail}`} className="font-semibold underline">{data.supportEmail}</a>{' '}
                for help.
              </div>
            ) : data.files.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                No downloadable files are attached to this product yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.files.map(file => (
                  <a
                    key={file.id}
                    href={file.downloadPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{file.fileName}</p>
                      <p className="text-xs text-neutral-400">{file.isLink ? 'External link' : file.fileType.toUpperCase()}</p>
                    </div>
                    {file.isLink
                      ? <ExternalLink size={16} className="text-neutral-500 shrink-0" />
                      : <Download size={16} className="text-neutral-500 shrink-0" />}
                  </a>
                ))}
              </div>
            )}

            {!revoked && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleResendReceipt}
                  disabled={resending}
                  className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors disabled:opacity-50"
                >
                  {resending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Resend receipt
                </button>
                {resendMessage && <p className="text-xs text-neutral-500 w-full">{resendMessage}</p>}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
              <Link href="/login?next=/dashboard/library" className="block">
                <Button variant="secondary" className="w-full">
                  Sign in to save in Library
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                <Shield size={12} />
                <span>Support: {data.supportEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
