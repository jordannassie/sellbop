import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { validateInviteToken } from '@/lib/partnerships/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ valid: false, reason: 'unavailable' })
  }

  const { token } = await params
  const result = await validateInviteToken(token)

  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: result.reason })
  }

  return NextResponse.json({
    valid: true,
    shopName: result.shopName,
    partnerName: result.partnerName,
    invitedEmail: result.invitedEmail,
  })
}
