import { NextRequest, NextResponse } from 'next/server'
import { getAllowedAdminEmails, isSupabaseAdminConfigured, isSupabaseConfigured } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false
    return getAllowedAdminEmails().includes(user.email.toLowerCase())
  } catch {
    return false
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ enabled: false })
  }

  try {
    const { getSupabaseServerClient: getClient } = await import('@/lib/supabase/server')
    const supabase = await getClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'demo_mode')
      .maybeSingle()

    const enabled = Boolean((data?.value as { enabled?: boolean } | null)?.enabled)
    return NextResponse.json({ enabled })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let enabled: boolean
  try {
    const body = await req.json() as { enabled?: unknown }
    enabled = Boolean(body.enabled)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 503 })
  }

  try {
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
    const admin = getSupabaseAdminClient()
    const { error } = await admin
      .from('app_settings')
      .upsert(
        { key: 'demo_mode', value: { enabled }, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enabled })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save setting'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
