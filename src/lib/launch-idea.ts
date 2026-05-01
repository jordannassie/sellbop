/**
 * Helpers for carrying a user's launch idea from the homepage prompt
 * through login/signup and into the AI Launch Assistant.
 *
 * The idea is stored in localStorage so it survives page navigation
 * and OAuth redirects (e.g. Google sign-in).
 *
 * Lifecycle:
 *   1. Homepage: user types idea → saveLaunchIdea()
 *   2. /login:   idea shown in banner, preserved before Google OAuth
 *   3. /dashboard: picks up idea from localStorage (Google OAuth path)
 *   4. /dashboard/ai-launch: clears idea once generation starts
 */

const IDEA_KEY = 'sellbop_launch_idea'

/**
 * Persist the launch idea.
 * Trims whitespace; removes the key if the result is empty.
 * Safe to call during SSR (no-ops silently).
 */
export function saveLaunchIdea(idea: string): void {
  try {
    const trimmed = idea.trim()
    if (trimmed) {
      localStorage.setItem(IDEA_KEY, trimmed)
    } else {
      localStorage.removeItem(IDEA_KEY)
    }
  } catch {
    // SSR or storage unavailable — ignore
  }
}

/**
 * Read the saved launch idea.
 * Returns null when storage is unavailable or empty.
 */
export function getLaunchIdea(): string | null {
  try {
    return localStorage.getItem(IDEA_KEY) || null
  } catch {
    return null
  }
}

/**
 * Remove the saved launch idea.
 * Safe to call multiple times or during SSR.
 */
export function clearLaunchIdea(): void {
  try {
    localStorage.removeItem(IDEA_KEY)
  } catch {
    // ignore
  }
}
