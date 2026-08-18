import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPurchaseAccessUrl } from '@/lib/services/purchase-access'

/**
 * @deprecated Use /api/access/[token]/files/[fileId] instead.
 * Supports authenticated library access by purchaseId only.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const purchaseId = searchParams.get('purchaseId')

  if (!purchaseId) {
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Use your purchase access link from email or Library.' },
      { status: 410 },
    )
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const admin = (await import('@/lib/supabase/admin')).getSupabaseAdminClient()
  const { data: purchase } = await admin
    .from('purchases')
    .select('id, access_token, buyer_user_id, buyer_email, status')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!purchase?.access_token || purchase.status !== 'active') {
    return NextResponse.json({ error: 'Access unavailable.' }, { status: 403 })
  }

  const normalizedEmail = user.email.toLowerCase()
  const ownsPurchase =
    purchase.buyer_user_id === user.id ||
    purchase.buyer_email?.toLowerCase() === normalizedEmail

  if (!ownsPurchase) {
    return NextResponse.json({ error: 'Access unavailable.' }, { status: 403 })
  }

  return NextResponse.json({
    access_url: getPurchaseAccessUrl(purchase.access_token),
  })
}
