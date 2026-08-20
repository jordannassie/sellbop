import 'server-only'

/** PostgreSQL/PostgREST errors when a relation (table/view) is not deployed. */
export function isMissingRelationError(error: { code?: string | null; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST205' || error.code === '42P01') return true
  const msg = error.message ?? ''
  return (
    msg.includes('does not exist')
    || msg.includes('schema cache')
    || msg.includes('Could not find the table')
    || (msg.includes('relation') && msg.includes('does not exist'))
  )
}

/** PostgreSQL/PostgREST errors when an RPC/function is not deployed. */
export function isMissingFunctionError(error: { code?: string | null; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST202' || error.code === '42883') return true
  const msg = error.message ?? ''
  return (
    msg.includes('Could not find the function')
    || msg.includes('function') && msg.includes('does not exist')
  )
}

/** Any missing-schema signal (table or RPC). */
export function isMissingSchemaError(error: { code?: string | null; message?: string } | null): boolean {
  return isMissingRelationError(error) || isMissingFunctionError(error)
}

export class PartnershipSchemaUnavailableError extends Error {
  constructor(message = 'Partnership system is not configured. Apply migration 030.') {
    super(message)
    this.name = 'PartnershipSchemaUnavailableError'
  }
}

let partnershipSchemaProbe: Promise<boolean> | null = null

/** One lightweight probe per server process; cached after first check. */
export function isPartnershipSchemaAvailable(): Promise<boolean> {
  if (!partnershipSchemaProbe) {
    partnershipSchemaProbe = (async () => {
      const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
      const admin = getSupabaseAdminClient()
      const { error } = await admin.from('store_partnerships').select('id').limit(1)
      if (!error) return true
      if (isMissingRelationError(error)) return false
      console.error('[schema-compat] partnership schema probe failed:', error.message)
      return false
    })()
  }
  return partnershipSchemaProbe
}
