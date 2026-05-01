import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const RESERVED = new Set([
  'dashboard','admin','api','p','store','marketplace','pricing',
  'login','signup','settings','products','checkout','library',
  'community','mission','university','about','terms','privacy',
  'start-selling','demo','internal','app','www','help','support',
])

function validate(value: string): string | null {
  if (!value || value.length < 3) return 'Must be at least 3 characters.'
  if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and dashes allowed.'
  if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a dash.'
  if (RESERVED.has(value)) return 'This link is reserved and cannot be used.'
  return null
}

export async function GET(req: NextRequest) {
  const value = req.nextUrl.searchParams.get('value')?.toLowerCase().trim() ?? ''
  const currentOwnerId = req.nextUrl.searchParams.get('ownerId') ?? ''

  const validationError = validate(value)
  if (validationError) {
    return NextResponse.json({ status: 'invalid', message: validationError })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    // Supabase not configured — cannot check, treat as available
    return NextResponse.json({ status: 'available' })
  }

  const { data, error } = await admin
    .from('stores')
    .select('id, owner_user_id, slug')
    .eq('slug', value)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ status: 'available' }) // fail open
  }

  if (!data) {
    return NextResponse.json({ status: 'available' })
  }

  // Allow the current owner to keep their existing link
  if (currentOwnerId && data.owner_user_id === currentOwnerId) {
    return NextResponse.json({ status: 'available' })
  }

  return NextResponse.json({ status: 'taken', message: 'This store link is already taken.' })
}
