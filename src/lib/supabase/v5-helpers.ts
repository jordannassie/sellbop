/**
 * v5-helpers.ts — Server-side helpers for V5 Supabase operations.
 *
 * All functions are server-only (never imported client-side).
 * Each helper returns null/empty on failure so callers can gracefully degrade.
 */
import 'server-only'

import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

// ── Safe admin client (returns null if not configured) ───────────────────────

export function tryGetAdmin(): SupabaseClient<Database> | null {
  if (!isSupabaseAdminConfigured()) return null
  try { return getSupabaseAdminClient() } catch { return null }
}

// ── Get authenticated user (returns null if not authed or Supabase missing) ──

export async function getAuthUser() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

// ── Resolve Supabase product UUID by slug ────────────────────────────────────
// Returns { productId, storeId, sellerUserId } or null

export async function resolveProductBySlug(
  admin: SupabaseClient<Database>,
  slug: string,
): Promise<{ productId: string; storeId: string; sellerUserId: string } | null> {
  const { data: product, error } = await admin
    .from('products')
    .select('id, store_id')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !product) return null

  const { data: store } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', product.store_id)
    .maybeSingle()

  if (!store) return null

  return {
    productId: product.id,
    storeId: store.id,
    sellerUserId: store.owner_user_id,
  }
}

// ── Verify seller owns the product ───────────────────────────────────────────
// Returns { productId, storeId } if the authed user owns it, null otherwise

export async function resolveAndVerifyProductOwnership(
  slug: string,
  userId: string,
): Promise<{ productId: string; storeId: string } | null> {
  const admin = tryGetAdmin()
  if (!admin) return null

  const resolved = await resolveProductBySlug(admin, slug)
  if (!resolved) return null

  if (resolved.sellerUserId !== userId) return null

  return { productId: resolved.productId, storeId: resolved.storeId }
}
