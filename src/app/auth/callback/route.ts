import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env, isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'
import { bootstrapAuthenticatedUser, resolvePostLoginDestination } from '@/lib/auth/post-login'
import type { AuthSession } from '@/lib/domain/auth'

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
 *  2. Exchange the code exactly once, then redirect straight to the user's
 *     final destination (dashboard / admin) in THIS SAME response — do not
 *     bounce through a second route that re-reads cookies on a fresh request.
 *     Relying on a follow-up request to see cookies set on this redirect's
 *     Set-Cookie headers is racy (some hosts/CDNs don't reliably propagate
 *     multiple Set-Cookie headers on a redirect before the next request
 *     lands), and was intermittently sending signed-in users back to
 *     /login instead of /dashboard. Deciding the destination here, from the
 *     user object `exchangeCodeForSession` already returns, removes that
 *     race entirely.
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
  // We don't know the final destination yet, so start the response pointed
  // at /dashboard and correct the Location below once we've resolved it.
  // (The response object — and its Set-Cookie headers — stays the same
  // either way; only the Location header changes.)
  const response = NextResponse.redirect(new URL('/dashboard', request.url))

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

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

  // ── Step 4: resolve the destination from the user we just got back ────────
  // Deliberately NOT re-reading the session via cookies() on a follow-up
  // request — we already have the user right here.
  const user = data.user
  if (!user?.email) {
    return NextResponse.redirect(new URL('/login?error=missing-user-email', request.url))
  }

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl:
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null,
  }

  let destination = '/dashboard'
  try {
    const account = await bootstrapAuthenticatedUser(session)
    destination = resolvePostLoginDestination(session, account)
  } catch {
    // If profile bootstrap (upsert/link) fails, don't strand the user on
    // /login — they're authenticated. Fall back to the default destination
    // and let the dashboard's own data-loading handle any retry.
    destination = '/dashboard'
  }

  // Rewrite the Location on the SAME response so the Set-Cookie headers
  // from the exchange above are preserved.
  response.headers.set('Location', new URL(destination, request.url).toString())
  return response
}
