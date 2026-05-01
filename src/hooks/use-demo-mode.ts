'use client'
/**
 * use-demo-mode.ts
 * React hook for reading and toggling demo mode.
 * Defaults to false (demo OFF) until localStorage is read on the client.
 */

import { useCallback, useEffect, useState } from 'react'
import { isDemoMode as getDemoMode, setDemoMode as persistDemoMode } from '@/lib/demo-mode'

export interface UseDemoModeResult {
  /** Current demo mode state. Starts false; resolves from localStorage after mount. */
  demoMode: boolean
  /** True once localStorage has been read (avoids loading demo data during SSR). */
  ready: boolean
  /** Enable or disable demo mode. Persists to localStorage immediately. */
  toggle: (enabled: boolean) => void
}

export function useDemoMode(): UseDemoModeResult {
  const [demoMode, setDemoModeState] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDemoModeState(getDemoMode())
    setReady(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const toggle = useCallback((enabled: boolean) => {
    persistDemoMode(enabled)
    setDemoModeState(enabled)
  }, [])

  return { demoMode, ready, toggle }
}
