import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { requireActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { generatePreviewLink } from '@/lib/partnerships/service'

/** POST /api/stores/manager-preview — preview link for shop managers of unpublished partner shops */
export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const active = await requireActiveStoreForUser(user.id)
    const partnership = await getPartnershipByStoreId(active.id)
    if (!partnership) {
      return NextResponse.json({ error: 'This shop is not a Partner Shop.' }, { status: 400 })
    }
    if (partnership.status === 'active') {
      return NextResponse.json({ url: `/store/${active.slug}` })
    }

    const { url } = await generatePreviewLink(partnership.id, user.id)
    return NextResponse.json({ url })
  } catch (err) {
    if (err instanceof ActiveStoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
