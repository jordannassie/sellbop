/**
 * demo-mode.ts — client-side only
 *
 * Demo mode is OFF by default for authenticated users.
 * When OFF: dashboard pages show real data (or clean empty states).
 * When ON:  dashboard pages fall back to seed / demo data.
 *
 * Activation:
 *   URL param  ?demo=1   → enables  demo mode + persists to localStorage
 *   URL param  ?demo=0   → disables demo mode + persists to localStorage
 *   localStorage key 'sellbop_demo_mode' = 'true'
 */

const KEY = 'sellbop_demo_mode'

/** Read current demo mode state (always false on the server). */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const params = new URLSearchParams(window.location.search)
    const param = params.get('demo')
    if (param === '1') {
      localStorage.setItem(KEY, 'true')
      return true
    }
    if (param === '0') {
      localStorage.setItem(KEY, 'false')
      return false
    }
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

/** Persist demo mode preference to localStorage. */
export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, enabled ? 'true' : 'false')
  } catch { /* storage unavailable */ }
}
