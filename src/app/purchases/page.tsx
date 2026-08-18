'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Package } from 'lucide-react'
import { PublicHeader } from '@/components/marketing/public-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PurchasesFindPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/purchases/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      setMessage(data.message ?? 'If purchases exist for that email, we sent you an access email.')
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
            <Package size={22} className="text-neutral-500" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Find my purchases</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Enter the email you used at checkout. If purchases exist, we&apos;ll email your access links.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Button type="submit" className="w-full" loading={loading}>
              <Mail size={16} /> Send access links
            </Button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-neutral-600">{message}</p>
          )}

          <p className="mt-6 text-center text-xs text-neutral-400">
            Already have an account?{' '}
            <Link href="/login?next=/dashboard/library" className="text-black hover:underline">
              Sign in to Library
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
