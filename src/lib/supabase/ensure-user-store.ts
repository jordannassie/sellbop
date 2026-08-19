/**
 * ensure-user-store.ts
 *
 * Ensures the authenticated user has at least one shop.
 * Does NOT resolve the active shop — use /api/stores for that.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { DEFAULT_STORE_BANNER_URL } from '@/lib/store-defaults'

export type StoreRow = Database['public']['Tables']['stores']['Row']

/** Convert a display name or email prefix into a safe URL-slug. */
export function slugFromText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

async function userHasAnyStore(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StoreRow | null> {
  const { data: memberships } = await supabase
    .from('store_members')
    .select('stores(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  const fromMember = memberships?.[0]?.stores as StoreRow | null | undefined
  if (fromMember) return fromMember

  const { data: rows, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) return null
  return rows?.[0] ?? null
}

/**
 * Ensure this account has at least one shop. Creates one only when none exist.
 * Returns an existing shop row — not necessarily the user's active shop.
 */
export async function ensureUserStore(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string | null,
  email: string,
): Promise<StoreRow | null> {
  const existing = await userHasAnyStore(supabase, userId)
  if (existing) return existing

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

  const storeName = name ?? email.split('@')[0]
  const { data: created, error: createErr } = await supabase
    .from('stores')
    .insert({
      owner_user_id: userId,
      slug,
      name: storeName,
      banner_url: DEFAULT_STORE_BANNER_URL,
      support_email: email,
    })
    .select('*')
    .single()

  if (createErr || !created) return null

  await supabase.from('store_members').upsert(
    {
      store_id: created.id,
      user_id: userId,
      role: 'owner',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'store_id,user_id' },
  ).then(() => undefined, () => undefined)

  return created
}
