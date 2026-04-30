import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser } from '@/lib/supabase/v5-helpers'

// GET /api/v5/buyer-content?productIds=uuid1,uuid2
// Returns product_files (visibility=buyers) + published product_updates for
// products the authenticated user has purchased.
export async function GET(req: NextRequest) {
  const productIdsParam = req.nextUrl.searchParams.get('productIds')
  if (!productIdsParam) return NextResponse.json({ files: {}, updates: {} })

  const productIds = productIdsParam.split(',').filter(Boolean)
  if (productIds.length === 0) return NextResponse.json({ files: {}, updates: {} })

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ files: {}, updates: {} })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ files: {}, updates: {}, fallback: true })

  // Verify buyer owns these products
  const { data: purchases } = await admin
    .from('purchases')
    .select('product_id')
    .eq('buyer_user_id', user.id)
    .in('product_id', productIds)

  const ownedIds = (purchases ?? []).map((p: { product_id: string }) => p.product_id)
  if (ownedIds.length === 0) return NextResponse.json({ files: {}, updates: {} })

  const [{ data: rawFiles }, { data: rawUpdates }] = await Promise.all([
    admin
      .from('product_files')
      .select('*')
      .in('product_id', ownedIds)
      .in('visibility', ['public', 'buyers'])
      .order('sort_order', { ascending: true }),
    admin
      .from('product_updates')
      .select('*')
      .in('product_id', ownedIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ])

  // Group by product_id
  const files: Record<string, typeof rawFiles> = {}
  const updates: Record<string, typeof rawUpdates> = {}

  for (const f of rawFiles ?? []) {
    const key = (f as { product_id: string }).product_id
    ;(files[key] ??= []).push(f)
  }
  for (const u of rawUpdates ?? []) {
    const key = (u as { product_id: string }).product_id
    ;(updates[key] ??= []).push(u)
  }

  return NextResponse.json({ files, updates })
}
