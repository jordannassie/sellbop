import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { revokeActiveClaudeConnections } from '@/lib/agent/revoke-claude-connections'

/** POST /api/agent-connections/revoke-claude — revoke every active Claude connection for the user. */
export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const revokedCount = await revokeActiveClaudeConnections(user.id)
    return NextResponse.json({ success: true, revokedCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not revoke connections.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
