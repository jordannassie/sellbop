'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

/**
 * Silently redirects authenticated users to the dashboard.
 * Renders nothing — drop it anywhere in a page to add the behaviour.
 */
export function AuthRedirect() {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!loading && session) {
      router.replace('/dashboard')
    }
  }, [session, loading, router])

  return null
}
