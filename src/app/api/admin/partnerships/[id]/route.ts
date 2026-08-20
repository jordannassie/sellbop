import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { getPartnershipDetail } from '@/lib/partnerships/queries'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'
import { PartnershipSchemaUnavailableError } from '@/lib/supabase/schema-compat'
import { isPartnershipStatus } from '@/lib/partnerships/constants'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    const detail = await getPartnershipDetail(id)
    if (!detail) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof PartnershipSchemaUnavailableError) {
      return NextResponse.json({ migrationRequired: true, message: err.message }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Failed to load partnership.'
    console.error('[GET /api/admin/partnerships/[id]]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = (await request.json()) as {
    partnerName?: string
    partnerEmail?: string
    status?: string
    internalNotes?: string
  }

  const patch: Database['public']['Tables']['store_partnerships']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (body.partnerName !== undefined) patch.partner_name = body.partnerName.trim() || null
  if (body.partnerEmail !== undefined) patch.partner_email = body.partnerEmail.trim().toLowerCase() || null
  if (body.internalNotes !== undefined) patch.internal_notes = body.internalNotes.trim() || null
  if (body.status !== undefined) {
    if (!isPartnershipStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    patch.status = body.status
  }

  const db = getSupabaseAdminClient()
  const { data, error } = await db
    .from('store_partnerships')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partnership: data })
}
