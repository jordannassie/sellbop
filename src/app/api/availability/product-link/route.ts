import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const RESERVED = new Set([
  'dashboard','admin','api','p','store','marketplace','pricing',
  'login','signup','settings','products','checkout','library',
  'new','ai-builder','ai-launch','edit','delete','create',
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
  const currentProductId = req.nextUrl.searchParams.get('productId') ?? ''

  const validationError = validate(value)
  if (validationError) {
    return NextResponse.json({ status: 'invalid', message: validationError })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ status: 'available' })
  }

  const { data, error } = await admin
    .from('products')
    .select('id, slug')
    .eq('slug', value)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ status: 'available' })
  }

  if (!data) {
    return NextResponse.json({ status: 'available' })
  }

  if (currentProductId && data.id === currentProductId) {
    return NextResponse.json({ status: 'available' })
  }

  return NextResponse.json({ status: 'taken', message: 'This product link is already taken.' })
}
