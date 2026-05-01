import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env, isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

/**
 * OAuth callback handler.
 *
 * Supabase redirects here after Google (or any provider) OAuth completes.
 * Possible inbound query shapes:
 *   Success:  ?code=<pkce_code>
 *   Error:    ?error=invalid_request&error_code=flow_state_already_used&error_description=...
 *
 * Rules:
 *  1. Check for OAuth error params FIRST — never attempt a code exchange when
 *     Supabase already reported an error.
 *  2. Exchange the code exactly once, then redirect to a clean URL (no code
 *     in the address bar).  This prevents the browser back-button from
 *     re-triggering the exchange.
 *  3. On `flow_state_already_used` (e.g. double-click or browser back after
 *     OAuth), redirect to /login with a friendly error identifier rather than
 *     a raw technical string.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=supabase-not-configured', request.url))
  }

  const sp = request.nextUrl.searchParams
  const code          = sp.get('code')
  const errorParam    = sp.get('error')       // e.g. "invalid_request"
  const errorCode     = sp.get('error_code')  // e.g. "flow_state_already_used"
  const errorDesc     = sp.get('error_description')

  // ── Step 1: bail out early on any OAuth-reported error ───────────────────
  if (errorParam || errorCode) {
    const isFlowState = errorCode === 'flow_state_already_used'
    if (isFlowState) {
      // The PKCE state was already consumed (common cause: double-click or
      // browser back).  Use a clean identifier so the login page can display
      // a friendly "try again" message.
      return NextResponse.redirect(
        new URL('/login?oauth_error=session_expired', request.url),
      )
    }
    const msg = errorDesc ?? errorParam ?? 'oauth-failed'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url),
    )
  }

  // ── Step 2: require a code ────────────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing-auth-code', request.url))
  }

  // ── Step 3: exchange code for session ─────────────────────────────────────
  // Build the success redirect first so we can attach session cookies to it.
  const redirectUrl = new URL('/auth/complete', request.url)
  const response    = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient<Database>(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Even if the exchange itself fails with flow_state_already_used, show
    // the friendly retry message.
    const isFlowState =
      error.message.toLowerCase().includes('flow_state') ||
      (error as { code?: string }).code === 'flow_state_already_used'

    if (isFlowState) {
      return NextResponse.redirect(
        new URL('/login?oauth_error=session_expired', request.url),
      )
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
    )
  }

  // ── Step 4: success — redirect to clean URL with session cookies set ──────
  return response
}
