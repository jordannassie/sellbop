'use client'
/**
 * use-user-store.ts
 *
 * React hook that returns the current authenticated user's Supabase store row.
 * - If Supabase is not configured (demo mode), returns a synthetic row built
 *   from DEMO_SELLER_PROFILE / DEMO_STOREFRONT so the rest of the UI works.
 * - Automatically calls ensureUserStore to create a store if none exists.
 * - Exposes saveStore() to persist field patches back to Supabase.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ensureUserStore } from '@/lib/supabase/ensure-user-store'
import type { StoreRow } from '@/lib/supabase/ensure-user-store'
import type { Database } from '@/lib/supabase/types'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'

export type { StoreRow }

/** Synthetic StoreRow from demo seed — used as fallback when Supabase is not configured. */
const DEMO_STORE_ROW: StoreRow = {
  id: DEMO_SELLER_PROFILE.id,
  owner_user_id: DEMO_SELLER_PROFILE.userId,
  slug: DEMO_STOREFRONT.slug,
  name: DEMO_STOREFRONT.title,
  headline: DEMO_STOREFRONT.headline ?? null,
  bio: DEMO_STOREFRONT.bio ?? null,
  avatar_url: DEMO_STOREFRONT.avatarUrl ?? null,
  banner_url: DEMO_STOREFRONT.bannerUrl ?? null,
  header_layout: null,
  layout_mode: null,
  branding_mode: null,
  created_at: DEMO_SELLER_PROFILE.createdAt,
  updated_at: DEMO_SELLER_PROFILE.createdAt,
}

export interface UseUserStoreResult {
  /** The current user's store row (Supabase or demo fallback). */
  store: StoreRow | null
  /** True while auth + store are still loading. */
  loading: boolean
  /** True when falling back to demo data (no Supabase configured, or no session). */
  isDemo: boolean
  /** Re-fetch the store from Supabase. */
  refetch: () => void
  /**
   * Persist a partial update to the authenticated user's store in Supabase.
   * Returns an error message string, or null on success.
   * No-ops silently when in demo mode.
   */
  saveStore: (patch: Database['public']['Tables']['stores']['Update']) => Promise<string | null>
}

export function useUserStore(): UseUserStoreResult {
  const { session, loading: authLoading } = useAuth()
  const [store, setStore] = useState<StoreRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const supabase = getSupabaseBrowserClient()
  const isDemo = !supabase || !session

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (authLoading) return

    if (!supabase || !session) {
      setStore(DEMO_STORE_ROW)
      setLoading(false)
      return
    }

    setLoading(true)
    ensureUserStore(supabase, session.userId, session.name, session.email)
      .then(s => {
        // s can be null if creation failed — do NOT fall back to demo data for
        // real users: that would show alexjohnson as their store slug.
        setStore(s)
        setLoading(false)
      })
      .catch(() => {
        setStore(null)
        setLoading(false)
      })
  // tick is the manual refetch trigger; supabase is stable (singleton)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId, authLoading, tick])
  /* eslint-enable react-hooks/set-state-in-effect */

  const refetch = useCallback(() => setTick(t => t + 1), [])

  const saveStore = useCallback(
    async (patch: Database['public']['Tables']['stores']['Update']): Promise<string | null> => {
      if (!supabase || !session) return null // demo mode — no-op

      // Ensure we have a store row with a real id before updating.
      // Avoids updating by owner_user_id which fails when multiple rows exist.
      let targetId = store?.id
      if (!targetId) {
        const created = await ensureUserStore(supabase, session.userId, session.name, session.email)
        if (!created) return 'Could not find or create your store. Please refresh and try again.'
        targetId = created.id
        setStore(created)
      }

      const { data, error } = await supabase
        .from('stores')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', targetId)
        .select('*')
        .maybeSingle()

      if (error) return error.message
      if (!data) return 'Could not save your store link. Please try again.'

      setStore(data as StoreRow)
      return null
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.userId, store?.id],
  )

  return {
    store,
    loading: authLoading || loading,
    isDemo,
    refetch,
    saveStore,
  }
}
