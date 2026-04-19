'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-7">
          <h1 className="text-xl font-bold text-black">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1">Log in to your Selli account</p>
        </div>
        <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600">
          <strong>Demo:</strong> creator@selli.demo / demo123
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <Button type="submit" loading={loading} className="w-full">Log in</Button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-5">
          Don&apos;t have an account? <Link href="/signup" className="text-black font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
