'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { demoAuth } from '@/lib/adapters/demo/auth'
import type { AuthSession } from '@/lib/domain/auth'

interface AuthContextValue {
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthSession>
  signUp: (email: string, password: string, name: string) => Promise<AuthSession>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    demoAuth.getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const s = await demoAuth.signIn(email, password)
    setSession(s)
    return s
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const s = await demoAuth.signUp(email, password, name)
    setSession(s)
    return s
  }, [])

  const signOut = useCallback(async () => {
    await demoAuth.signOut()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
