import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { claimPartnerShop, PartnershipError } from '@/lib/partnerships/service'

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { token?: string }
  const token = body.token?.trim()
  if (!token) return NextResponse.json({ error: 'Invitation token is required.' }, { status: 400 })

  try {
    const result = await claimPartnerShop(token, user.id, user.email)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    if (err instanceof PartnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
