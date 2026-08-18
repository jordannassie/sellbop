import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getEmailConfigStatus } from '@/lib/email/service'
import { isMissingRelationError } from '@/lib/admin/helpers'

export async function getAdminEmailDeliveries(limit = 50) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('transactional_email_deliveries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error && isMissingRelationError(error)) {
    return []
  }
  if (error) throw error
  return data ?? []
}

export function getAdminEmailConfigStatus() {
  return getEmailConfigStatus()
}
