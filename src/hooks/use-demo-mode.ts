'use client'
/**
 * use-demo-mode.ts
 * Demo mode has been removed from production Sellbop.
 * This hook always returns demoMode: false.
 * Kept for backward compatibility during refactoring.
 */

export interface UseDemoModeResult {
  demoMode: boolean
  ready: boolean
  toggle: (enabled: boolean) => void
}

export function useDemoMode(): UseDemoModeResult {
  return { demoMode: false, ready: true, toggle: () => {} }
}
