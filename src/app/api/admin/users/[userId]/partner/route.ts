import { NextRequest, NextResponse } from 'next/server'
import { getAllowedAdminEmails, isSupabaseAdminConfigured } from '@/lib/env'
import { setUserPartnerStatus } from '@/lib/admin/partner'
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  let isPartner: boolean
  try {
    const body = await req.json() as { isPartner?: unknown }
    if (typeof body.isPartner !== 'boolean') {
      return NextResponse.json({ error: 'isPartner must be a boolean.' }, { status: 400 })
    }
    isPartner = body.isPartner
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const result = await setUserPartnerStatus(userId, isPartner)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update partner status.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
