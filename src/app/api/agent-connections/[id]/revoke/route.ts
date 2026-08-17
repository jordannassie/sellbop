import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'

// POST /api/agent-connections/[id]/revoke — immediately disable a connection's token
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { data: connection } = await admin
    .from('agent_connections')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle()

  if (!connection || connection.user_id !== user.id) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 })
  }

  const { error } = await admin
    .from('agent_connections')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
