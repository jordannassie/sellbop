'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { ShieldCheck, Package, Upload, TrendingUp, Ban } from 'lucide-react'

function AuthorizeInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const clientId = params.get('client_id') ?? ''
  const redirectUri = params.get('redirect_uri') ?? ''
  const codeChallenge = params.get('code_challenge') ?? ''
  const codeChallengeMethod = params.get('code_challenge_method') ?? 'S256'
  const state = params.get('state') ?? ''
  const scope = params.get('scope') ?? ''

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      const next = `/oauth/authorize?${params.toString()}`
      router.replace(`/login?next=${encodeURIComponent(next)}`)
    }
  }, [authLoading, session, router, params])

  async function handleAllow() {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          state,
          scope,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description ?? data.error ?? 'Could not authorize.')
      window.location.href = data.redirect_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not authorize.')
      setWorking(false)
    }
  }

  function handleDeny() {
    if (!redirectUri) { router.push('/dashboard'); return }
    const url = new URL(redirectUri)
    url.searchParams.set('error', 'access_denied')
    if (state) url.searchParams.set('state', state)
    window.location.href = url.toString()
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    )
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-semibold text-black mb-1">Invalid authorization request</p>
          <p className="text-sm text-neutral-500">This link is missing required parameters. Go back to Claude and try connecting again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <SellBopLogo className="mb-6" />
        <h1 className="text-lg font-bold text-black mb-1">Claude wants to access your SellBop store</h1>
        <p className="text-sm text-neutral-500 mb-5">Signed in as {session.email}</p>

        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Package size={13} className="text-emerald-500 flex-shrink-0" /> Read and create products
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Upload size={13} className="text-emerald-500 flex-shrink-0" /> Upload files and images
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <TrendingUp size={13} className="text-emerald-500 flex-shrink-0" /> Manage affiliates
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1 border-t border-neutral-200 mt-2">
            <Ban size={13} className="flex-shrink-0" /> Never: delete products, refunds, payouts, Stripe settings
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleDeny} disabled={working}>Deny</Button>
          <Button className="flex-1 font-bold" onClick={handleAllow} loading={working}>
            <ShieldCheck size={14} /> Allow
          </Button>
        </div>

        <p className="text-[10px] text-neutral-400 mt-4 text-center">
          You can revoke this anytime from Settings → AI & Integrations.
        </p>
      </div>
    </div>
  )
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <AuthorizeInner />
    </Suspense>
  )
}
