import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/** Revoke active Claude connections for a user. Optionally keep one row. */
export async function revokeActiveClaudeConnections(
  userId: string,
  exceptConnectionId?: string,
): Promise<number> {
  const admin = getSupabaseAdminClient()
  const now = new Date().toISOString()

  let query = admin
    .from('agent_connections')
    .update({ revoked_at: now })
    .eq('user_id', userId)
    .eq('provider', 'claude')
    .is('revoked_at', null)

  if (exceptConnectionId) {
    query = query.neq('id', exceptConnectionId)
  }

  const { data, error } = await query.select('id')
  if (error) throw error
  return data?.length ?? 0
}
