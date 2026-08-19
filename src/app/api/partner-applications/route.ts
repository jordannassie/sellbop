import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import {
  AUDIENCE_SIZE_OPTIONS,
  isAudienceSizeOption,
} from '@/lib/partner-applications/constants'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  let body: {
    name?: unknown
    email?: unknown
    phone?: unknown
    socialLinks?: unknown
    audienceSize?: unknown
    message?: unknown
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null
  const socialLinks = typeof body.socialLinks === 'string' ? body.socialLinks.trim() : ''
  const audienceSize = typeof body.audienceSize === 'string' ? body.audienceSize.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!audienceSize || !isAudienceSizeOption(audienceSize)) {
    return NextResponse.json(
      { error: `Please select an audience size. Valid options: ${AUDIENCE_SIZE_OPTIONS.join(', ')}` },
      { status: 400 },
    )
  }

  let userId: string | null = null
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    /* visitor not logged in */
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('partner_applications')
    .insert({
      user_id: userId,
      name,
      email,
      phone: phone || null,
      social_links: socialLinks,
      audience_size: audienceSize,
      message,
      status: 'new',
      admin_notes: '',
    })
    .select('id')
    .single()

  if (error) {
    const messageText = error.message.includes('partner_applications')
      ? 'Partner applications are not available yet. Please try again shortly.'
      : error.message
    return NextResponse.json({ error: messageText }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, success: true }, { status: 201 })
}
