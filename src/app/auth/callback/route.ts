import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env, isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=supabase-not-configured', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const errorDescription = request.nextUrl.searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url),
    )
  }

  const redirectUrl = new URL('/auth/complete', request.url)
  const response = NextResponse.redirect(redirectUrl)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing-auth-code', request.url))
  }

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
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
    )
  }

  return response
}
