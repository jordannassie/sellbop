'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AUDIENCE_SIZE_OPTIONS, type AudienceSizeOption } from '@/lib/partner-applications/constants'
import { cn } from '@/lib/utils'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function PartnerApplicationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [socialLinks, setSocialLinks] = useState('')
  const [audienceSize, setAudienceSize] = useState<AudienceSizeOption | ''>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || success) return

    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!audienceSize) {
      setError('Please select your audience size.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          socialLinks,
          audienceSize,
          message,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit application.')

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-600" />
        <p className="text-lg font-semibold text-black mb-2">
          Thanks! We received your Partner application.
        </p>
        <p className="text-sm text-neutral-600">Our team will be in touch.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Input
          label="Name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Optional"
        disabled={loading}
      />

      <Textarea
        label="Social Media / Website Links"
        value={socialLinks}
        onChange={e => setSocialLinks(e.target.value)}
        placeholder="Paste your Instagram, TikTok, YouTube, X, website, podcast, newsletter, or any other links here. One per line is perfect."
        rows={6}
        resize="vertical"
        disabled={loading}
        className="min-h-[140px]"
      />

      <div>
        <p className="text-sm font-medium text-neutral-700 mb-1">Your Audience Size</p>
        <p className="text-xs text-neutral-500 mb-3">
          About how large is your total audience across your main platforms?
        </p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_SIZE_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              disabled={loading}
              onClick={() => setAudienceSize(option)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                audienceSize === option
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Tell us about your audience, what you create, and what kind of digital products you would be interested in building."
        rows={6}
        resize="vertical"
        disabled={loading}
        className="min-h-[140px]"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Submitting…
          </>
        ) : (
          'Apply to Partner'
        )}
      </Button>
    </form>
  )
}
