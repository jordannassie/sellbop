import { NextRequest, NextResponse } from 'next/server'
import { updatePartnerApplication } from '@/lib/admin/partner-applications'
import { getAllowedAdminEmails, isSupabaseAdminConfigured } from '@/lib/env'
import {
  isPartnerApplicationStatus,
  type PartnerApplicationStatus,
} from '@/lib/partner-applications/constants'
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
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { status?: unknown; adminNotes?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const patch: { status?: PartnerApplicationStatus; adminNotes?: string } = {}

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !isPartnerApplicationStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    patch.status = body.status
  }

  if (body.adminNotes !== undefined) {
    if (typeof body.adminNotes !== 'string') {
      return NextResponse.json({ error: 'adminNotes must be a string.' }, { status: 400 })
    }
    patch.adminNotes = body.adminNotes
  }

  if (patch.status === undefined && patch.adminNotes === undefined) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  }

  try {
    const application = await updatePartnerApplication(id, patch)
    return NextResponse.json(application)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update application.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
