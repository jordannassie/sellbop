/** Detect Supabase/PostgREST errors for tables that are not deployed yet. */
export function isMissingRelationError(error: { code?: string | null; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST205') return true
  const msg = error.message ?? ''
  return (
    msg.includes('does not exist')
    || msg.includes('schema cache')
    || msg.includes('Could not find the table')
  )
}
