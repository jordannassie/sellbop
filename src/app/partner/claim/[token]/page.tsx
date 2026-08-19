'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export default function PartnerClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [invite, setInvite] = useState<{ shopName: string; partnerName?: string; invitedEmail: string } | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { params.then(p => setToken(p.token)) }, [params])

  useEffect(() => {
    if (!token) return
    if (typeof window !== 'undefined') sessionStorage.setItem('sellbop_claim_token', token)
    fetch(`/api/partner/claim/${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) {
          setReason(data.reason ?? 'invalid')
          return
        }
        setInvite({ shopName: data.shopName, partnerName: data.partnerName, invitedEmail: data.invitedEmail })
      })
  }, [token])

  async function handleClaim() {
    if (!token || !session) return
    setClaiming(true)
    setError(null)
    const res = await fetch('/api/partner/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setClaiming(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not claim Shop.')
      return
    }
    if (typeof window !== 'undefined') sessionStorage.removeItem('sellbop_claim_token')
    router.push('/dashboard?claimed=1')
  }

  if (!token || (authLoading && !invite && !reason)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  if (reason) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Invitation unavailable</h1>
          <p className="text-neutral-500 mt-2">This invitation is {reason === 'expired' ? 'expired' : reason === 'accepted' ? 'already used' : 'invalid'}.</p>
        </div>
      </div>
    )
  }

  if (!invite) return null

  const emailMatch = session?.email?.toLowerCase() === invite.invitedEmail.toLowerCase()

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold">Your Shop is Ready</h1>
        <p className="text-lg font-semibold mt-4">{invite.shopName}</p>
        {invite.partnerName && <p className="text-neutral-500 mt-1">Prepared for {invite.partnerName}</p>}

        {!session ? (
          <div className="mt-8 space-y-3">
            <Link href={`/signup?claim=${token}`}>
              <Button className="w-full">Create SellBop Account</Button>
            </Link>
            <Link href={`/login?redirect=/partner/claim/${token}`}>
              <Button variant="secondary" className="w-full">Sign In</Button>
            </Link>
          </div>
        ) : !emailMatch ? (
          <div className="mt-8">
            <p className="text-sm text-neutral-600">This invitation was sent to <strong>{invite.invitedEmail}</strong>.</p>
            <p className="text-sm text-neutral-500 mt-2">You are signed in as {session.email}.</p>
            <Link href={`/login?redirect=/partner/claim/${token}`} className="inline-block mt-4 text-sm underline">Sign out and use another account</Link>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-sm text-neutral-600 mb-4">This Shop will be added to your SellBop account.</p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <Button className="w-full" onClick={handleClaim} loading={claiming}>Claim Shop</Button>
          </div>
        )}
      </div>
    </div>
  )
}
