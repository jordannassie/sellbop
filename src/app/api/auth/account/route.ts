import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getAccountSummaryByUserId, linkGuestCommerceByEmail } from '@/lib/auth/post-login'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ account: null }, { status: 200 })
  }

  // Claim any guest purchases / orders / subscriptions made with this email
  // before the user signed up or while they were signed out.
  try {
    await linkGuestCommerceByEmail(user.id, user.email)
  } catch {
    // Non-fatal: the library query will still fall back to email matching.
  }

  const account = await getAccountSummaryByUserId(user.id)
  return NextResponse.json({ account })
}
