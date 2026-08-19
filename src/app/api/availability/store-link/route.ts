import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { validateStoreSlug } from '@/lib/store-slugs'

export async function GET(req: NextRequest) {
  const value = req.nextUrl.searchParams.get('value')?.toLowerCase().trim() ?? ''
  const currentOwnerId = req.nextUrl.searchParams.get('ownerId') ?? ''

  const validationError = validateStoreSlug(value)
  if (validationError) {
    return NextResponse.json({ status: 'invalid', message: validationError })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ status: 'available' })
  }

  const { data, error } = await admin
    .from('stores')
    .select('id, owner_user_id, slug')
    .eq('slug', value)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ status: 'available' })
  }

  if (!data) {
    return NextResponse.json({ status: 'available' })
  }

  if (currentOwnerId && data.owner_user_id === currentOwnerId) {
    return NextResponse.json({ status: 'available' })
  }

  return NextResponse.json({ status: 'taken', message: 'This store link is already taken.' })
}
