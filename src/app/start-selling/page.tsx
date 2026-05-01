'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'

export default function StartSellingPage() {
  const router = useRouter()
  const { session, account, loading, refreshAccount } = useAuth()
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login')
    }
  }, [loading, router, session])

  useEffect(() => {
    if (account?.hasStore) {
      router.push('/dashboard')
    }
  }, [account, router])

  function updateName(value: string) {
    setStoreName(value)
    setStoreSlug((current) => (current ? current : slugify(value)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/start-selling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: storeName, slug: storeSlug }),
    })

    const data = (await res.json()) as { error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Could not create your store.')
      setSubmitting(false)
      return
    }

    await refreshAccount()
    router.push('/dashboard')
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Start Selling</p>
        <h1 className="mt-2 text-3xl font-bold text-black">Create your store</h1>
        <p className="mt-2 text-sm text-neutral-500">
          You already have a SellBop account. Now let’s create the store that powers your seller dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Store Name"
            value={storeName}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Alex Creates"
            required
          />

          <Input
            label="Store link"
            value={storeSlug}
            onChange={(e) => setStoreSlug(slugify(e.target.value))}
            placeholder="alex-creates"
            hint={`Your public store: sellbop.com/store/${storeSlug || 'your-link'}`}
            required
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            Create Store
          </Button>
        </form>
      </div>
    </div>
  )
}
