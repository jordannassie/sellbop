/**
 * ensure-user-store.ts
 *
 * Client-side helper that finds the Supabase store owned by the current auth
 * user, or creates one automatically (with a unique slug derived from their
 * name / email).
 *
 * Uses the browser Supabase client — RLS rules allow authenticated users to
 * read/insert their own store row via `auth.uid() = owner_user_id`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export type StoreRow = Database['public']['Tables']['stores']['Row']

/** Convert a display name or email prefix into a safe URL-slug. */
export function slugFromText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining accents
    .replace(/[^a-z0-9\s-]/g, '')     // keep letters, digits, spaces, dashes
    .trim()
    .replace(/\s+/g, '-')             // spaces → dashes
    .replace(/-+/g, '-')              // collapse consecutive dashes
    .replace(/^-|-$/g, '')            // trim leading/trailing dashes
    .slice(0, 30)
}

/**
 * Find the store owned by `userId`, or create one if none exists.
 * Returns the store row on success, or `null` if the operation fails
 * (e.g. RLS violation, network error, Supabase not configured).
 *
 * Handles the case where a user may have multiple store rows: picks the
 * most-recently-updated one instead of failing on .maybeSingle().
 */
export async function ensureUserStore(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string | null,
  email: string,
): Promise<StoreRow | null> {
  // ── 1. Look for existing stores (user may have duplicates) ───
  const { data: rows, error: findErr } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (findErr) return null

  const existing = rows?.[0] ?? null

  if (process.env.NODE_ENV === 'development' && (rows?.length ?? 0) > 1) {
    console.warn(`[SellBop] User ${userId} has multiple store rows. Using most recently updated.`)
  }

  if (existing) return existing

  // ── 2. Generate a unique slug ────────────────────────────────
  const base = slugFromText(name ?? email.split('@')[0])
  if (!base) return null

  let slug = base
  for (let attempt = 1; attempt <= 6; attempt++) {
    const { data: taken } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!taken) break
    slug = `${base}-${attempt + 1}`
  }

  // ── 3. Create the store ──────────────────────────────────────
  const storeName = name ?? email.split('@')[0]
  const { data: created, error: createErr } = await supabase
    .from('stores')
    .insert({ owner_user_id: userId, slug, name: storeName })
    .select('*')
    .single()

  if (createErr) return null
  return created
}
