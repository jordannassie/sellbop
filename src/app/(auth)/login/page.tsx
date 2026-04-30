'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  )
}

function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>(
    params.get('mode') === 'signup' ? 'signup' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwdReadOnly, setPwdReadOnly] = useState(true)
  const routeError = params.get('error') ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }

      router.push('/auth/complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'login' ? 'Login failed.' : 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google login failed.')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50 p-2">
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            {(['signup', 'login'] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => {
                  setMode(nextMode)
                  setError('')
                  setName('')
                  setEmail('')
                  setPassword('')
                  setPwdReadOnly(true)
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                  mode === nextMode
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {nextMode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-7">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-black">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === 'login'
                ? 'Use one account for buying, selling, or both.'
                : 'Create one account for your whole SellBop journey.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-100" />
            <span className="text-xs font-medium text-neutral-400">or continue with email</span>
            <div className="h-px flex-1 bg-neutral-100" />
          </div>

          <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">
            {mode === 'login'
              ? 'Use Google or your SellBop email and password.'
              : 'One SellBop account works for buyers, sellers, or both.'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">Password</label>
                {mode === 'login' && (
                  <Link href="#" className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-black">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                readOnly={pwdReadOnly}
                onFocus={() => setPwdReadOnly(false)}
                onClick={() => setPwdReadOnly(false)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={mode === 'signup' ? 6 : undefined}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {(error || routeError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error || routeError}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full !mt-5">
              {mode === 'login' ? 'Log in' : 'Create Account'}
            </Button>

            {mode === 'signup' && (
              <p className="pt-1 text-center text-[11px] leading-relaxed text-neutral-400">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="font-medium text-neutral-500 underline underline-offset-2 transition-colors hover:text-black">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-neutral-500 underline underline-offset-2 transition-colors hover:text-black">
                  Privacy Policy
                </Link>
                .
              </p>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-center gap-4 pt-1">
                <Link href="/terms" className="text-[11px] text-neutral-400 underline underline-offset-2 transition-colors hover:text-black">
                  Terms of Use
                </Link>
                <span className="text-xs text-neutral-200">·</span>
                <Link href="/privacy" className="text-[11px] text-neutral-400 underline underline-offset-2 transition-colors hover:text-black">
                  Privacy Policy
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-2xl border border-neutral-200 bg-white" />}
    >
      <AuthForm />
    </Suspense>
  )
}
