import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getEmailConfigStatus } from '@/lib/email/service'

export async function getAdminEmailDeliveries(limit = 50) {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from('transactional_email_deliveries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export function getAdminEmailConfigStatus() {
  return getEmailConfigStatus()
}
