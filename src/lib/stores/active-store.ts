import 'server-only'

import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'
import type { StoreMemberRole } from './types'

export const ACTIVE_STORE_COOKIE = 'sellbop_active_store_id'

export type { StoreMemberRole } from './types'

export type AccessibleStore = Database['public']['Tables']['stores']['Row'] & {
  role: StoreMemberRole
}

const MANAGE_ROLES = new Set<StoreMemberRole>(['owner', 'admin', 'manager'])

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  }
}

export async function readActiveStoreIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_STORE_COOKIE)?.value ?? null
}

export async function setActiveStoreCookie(storeId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, cookieOptions())
}

export async function clearActiveStoreCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_STORE_COOKIE)
}

/** Stores the user can access via store_members (with full store row). */
export async function getAccessibleStoresForUser(userId: string): Promise<AccessibleStore[]> {
  const admin = getSupabaseAdminClient()

  const { data: memberships, error } = await admin
    .from('store_members')
    .select('role, stores(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    // Fallback before migration 029: owner_user_id on stores
    const { data: owned } = await admin
      .from('stores')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })

    return (owned ?? []).map(store => ({ ...store, role: 'owner' as StoreMemberRole }))
  }

  const stores: AccessibleStore[] = []
  for (const row of memberships ?? []) {
    const store = row.stores as Database['public']['Tables']['stores']['Row'] | null
    if (store) {
      stores.push({ ...store, role: row.role as StoreMemberRole })
    }
  }

  // Safety net: owned stores missing membership rows (pre-backfill edge case)
  if (stores.length === 0) {
    const { data: owned } = await admin
      .from('stores')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })

    return (owned ?? []).map(store => ({ ...store, role: 'owner' as StoreMemberRole }))
  }

  return stores
}

export async function userCanAccessStore(userId: string, storeId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient()

  const { data: membership } = await admin
    .from('store_members')
    .select('id')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .maybeSingle()

  if (membership) return true

  const { data: owned } = await admin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('owner_user_id', userId)
    .maybeSingle()

  return !!owned
}

export async function userCanManageStore(userId: string, storeId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient()

  const { data: membership } = await admin
    .from('store_members')
    .select('role')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .maybeSingle()

  if (membership && MANAGE_ROLES.has(membership.role as StoreMemberRole)) return true

  const { data: owned } = await admin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('owner_user_id', userId)
    .maybeSingle()

  return !!owned
}

export async function getActiveStoreForUser(userId: string): Promise<AccessibleStore | null> {
  const accessible = await getAccessibleStoresForUser(userId)
  if (accessible.length === 0) return null

  const cookieStoreId = await readActiveStoreIdFromCookie()
  if (cookieStoreId) {
    const match = accessible.find(s => s.id === cookieStoreId)
    if (match) return match
  }

  const fallback = accessible[0]
  await setActiveStoreCookie(fallback.id)
  return fallback
}

export async function requireActiveStoreForUser(userId: string): Promise<AccessibleStore> {
  const store = await getActiveStoreForUser(userId)
  if (!store) {
    throw new ActiveStoreError('No shop found for this account.', 404)
  }
  return store
}

export class ActiveStoreError extends Error {
  status: number
  constructor(message: string, status = 404) {
    super(message)
    this.status = status
  }
}

/** Switch active shop after verifying access; sets cookie. */
export async function switchActiveStoreForUser(
  userId: string,
  storeId: string,
): Promise<AccessibleStore> {
  const canAccess = await userCanAccessStore(userId, storeId)
  if (!canAccess) {
    throw new ActiveStoreError('You do not have access to this shop.', 403)
  }

  await setActiveStoreCookie(storeId)

  const accessible = await getAccessibleStoresForUser(userId)
  const match = accessible.find(s => s.id === storeId)
  if (!match) {
    throw new ActiveStoreError('Shop not found.', 404)
  }
  return match
}

/** Browser client: list stores via store_members with owner fallback. */
export async function getAccessibleStoresForUserClient(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AccessibleStore[]> {
  const { data: memberships, error } = await supabase
    .from('store_members')
    .select('role, stores(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    const { data: owned } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })

    return (owned ?? []).map(store => ({ ...store, role: 'owner' as StoreMemberRole }))
  }

  const stores: AccessibleStore[] = []
  for (const row of memberships ?? []) {
    const store = row.stores as Database['public']['Tables']['stores']['Row'] | null
    if (store) {
      stores.push({ ...store, role: row.role as StoreMemberRole })
    }
  }

  if (stores.length === 0) {
    const { data: owned } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true })

    return (owned ?? []).map(store => ({ ...store, role: 'owner' as StoreMemberRole }))
  }

  return stores
}
