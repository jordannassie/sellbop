import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { verifyPlatformAdmin } from '@/lib/admin/verify-admin'
import { listAdminPartnerships } from '@/lib/partnerships/queries'
import { PartnershipSchemaUnavailableError } from '@/lib/supabase/schema-compat'
import { createPartnerShop, PartnershipError } from '@/lib/partnerships/service'

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const partnerships = await listAdminPartnerships()
    return NextResponse.json({ partnerships })
  } catch (err) {
    if (err instanceof PartnershipSchemaUnavailableError) {
      return NextResponse.json({
        partnerships: [],
        migrationRequired: true,
        message: err.message,
      })
    }
    const message = err instanceof Error ? err.message : 'Failed to load partnerships.'
    console.error('[GET /api/admin/partnerships]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = await verifyPlatformAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await request.json()) as {
    shopName?: string
    shopSlug?: string
    partnerName?: string
    partnerEmail?: string
  }

  try {
    const result = await createPartnerShop({
      adminUserId: admin.userId,
      shopName: body.shopName ?? '',
      shopSlug: body.shopSlug,
      partnerName: body.partnerName,
      partnerEmail: body.partnerEmail,
    })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (err) {
    if (err instanceof PartnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
