'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { getAuthCallbackUrl } from '@/lib/app-url'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { AccountSummary, AuthSession } from '@/lib/domain/auth'
import { isAuthenticatedEmailVerified } from '@/lib/auth/email-verification'

interface AuthContextValue {
  session: AuthSession | null
  account: AccountSummary | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshAccount: () => Promise<void>
  /** Imperatively update avatarUrl in the current session (e.g. after uploading a profile photo). */
  updateAvatarUrl: (url: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toSession(user: User | null): AuthSession | null {
  if (!user?.email) return null

  const metadata = user.user_metadata ?? {}
  const name =
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    null

  const avatarUrl =
    metadata.avatar_url ??
    metadata.picture ??
    null

  return {
    userId: user.id,
    email: user.email,
    name,
    avatarUrl,
    emailVerified: isAuthenticatedEmailVerified(user),
  }
}

function ensureSupabaseAuthConfigured(): never {
  throw new Error(
    'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using login.',
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<AuthSession | null>(null)
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  async function refreshAccount() {
    const res = await fetch('/api/auth/account', { cache: 'no-store' })
    if (!res.ok) {
      setAccount(null)
      return
    }

    const data = (await res.json()) as { account: AccountSummary | null }
    setAccount(data.account)
  }

  /** Non-blocking: fetch profiles.avatar_url and merge into session if present. */
  async function mergeProfileAvatar(userId: string) {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', userId)
        .single()
      if (data?.avatar_url) {
        setSession(prev => (prev ? { ...prev, avatarUrl: data.avatar_url } : prev))
      }
    } catch { /* best-effort */ }
  }

  function updateAvatarUrl(url: string) {
    setSession(prev => (prev ? { ...prev, avatarUrl: url } : prev))
  }

  useEffect(() => {
    let active = true

    if (!supabase) {
      return () => {
        active = false
      }
    }

    const authClient = supabase

    async function load() {
      const {
        data: { user },
      } = await authClient.auth.getUser()

      if (!active) return

      const nextSession = toSession(user)
      setSession(nextSession)

      if (nextSession) {
        // Non-blocking: prefer profiles.avatar_url over auth metadata
        void mergeProfileAvatar(nextSession.userId)
        await refreshAccount()
      } else {
        setAccount(null)
      }

      if (active) {
        setLoading(false)
      }
    }

    void load()

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, authSession) => {
      const nextSession = toSession(authSession?.user ?? null)
      setSession(nextSession)

      if (nextSession) {
        void mergeProfileAvatar(nextSession.userId)
        void refreshAccount()
      } else {
        setAccount(null)
      }

      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  async function signIn(email: string, password: string) {
    if (!supabase) ensureSupabaseAuthConfigured()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, name: string) {
    if (!supabase) ensureSupabaseAuthConfigured()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) throw error
  }

  async function signInWithGoogle() {
    if (!supabase) ensureSupabaseAuthConfigured()
    const redirectTo = getAuthCallbackUrl(window.location.origin)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) throw error
  }

  async function signOut() {
    if (!supabase) {
      setSession(null)
      setAccount(null)
      return
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* best-effort */ }

    const { error } = await supabase.auth.signOut()
    if (error) throw error

    setSession(null)
    setAccount(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        account,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshAccount,
        updateAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
