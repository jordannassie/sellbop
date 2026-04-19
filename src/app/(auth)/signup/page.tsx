'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signUp(email, password, name)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-7">
          <h1 className="text-xl font-bold text-black">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1">Start selling in minutes.</p>
        </div>
        <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600">
          <strong>Demo mode:</strong> any email/password works for new signups.
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input label="Full Name" type="text" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <Button type="submit" loading={loading} className="w-full">Create Account</Button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account? <Link href="/login" className="text-black font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
