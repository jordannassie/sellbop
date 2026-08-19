'use client'
/**
 * use-user-store.ts
 *
 * React hook for the authenticated user's shops.
 * `store` is the currently-selected ACTIVE shop (not the only shop).
 */

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ensureUserStore } from '@/lib/supabase/ensure-user-store'
import type { StoreRow } from '@/lib/supabase/ensure-user-store'
import type { Database } from '@/lib/supabase/types'
import type { UserStoreSummary } from '@/lib/stores/types'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { DEFAULT_STORE_BANNER_URL } from '@/lib/store-defaults'
import { toast } from 'sonner'

export type { StoreRow, UserStoreSummary }

const DEMO_STORE_ROW: StoreRow = {
  id: DEMO_SELLER_PROFILE.id,
  owner_user_id: DEMO_SELLER_PROFILE.userId,
  slug: DEMO_STOREFRONT.slug,
  name: DEMO_STOREFRONT.title,
  headline: DEMO_STOREFRONT.headline ?? null,
  bio: DEMO_STOREFRONT.bio ?? null,
  avatar_url: DEMO_STOREFRONT.avatarUrl ?? null,
  banner_url: DEMO_STOREFRONT.bannerUrl ?? DEFAULT_STORE_BANNER_URL,
  social_links: null,
  header_layout: null,
  layout_mode: null,
  branding_mode: null,
  support_email: null,
  stripe_account_id: null,
  stripe_onboarding_complete: false,
  stripe_charges_enabled: false,
  stripe_payouts_enabled: false,
  created_at: DEMO_SELLER_PROFILE.createdAt,
  updated_at: DEMO_SELLER_PROFILE.createdAt,
}

const ENTITY_DETAIL_PATTERNS = [
  /^\/dashboard\/products\/[^/]+$/,
  /^\/dashboard\/orders\/[^/]+$/,
  /^\/dashboard\/sales\/[^/]+$/,
]

function shouldLeaveDetailRoute(pathname: string): boolean {
  return ENTITY_DETAIL_PATTERNS.some(p => p.test(pathname))
}

export interface UseUserStoreResult {
  store: StoreRow | null
  stores: UserStoreSummary[]
  activeStoreId: string | null
  loading: boolean
  switching: boolean
  isDemo: boolean
  refetch: () => void
  saveStore: (patch: Database['public']['Tables']['stores']['Update']) => Promise<string | null>
  switchStore: (storeId: string) => Promise<boolean>
  createStore: (input: { name: string; slug?: string }) => Promise<{ ok: true } | { ok: false; error: string }>
}

async function fetchFullStore(storeId: string): Promise<StoreRow | null> {
  const res = await fetch(`/api/stores/${storeId}`, { credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json()
  return data.store as StoreRow
}

export function useUserStore(): UseUserStoreResult {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [store, setStore] = useState<StoreRow | null>(null)
  const [stores, setStores] = useState<UserStoreSummary[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [tick, setTick] = useState(0)
  const supabase = getSupabaseBrowserClient()
  const isDemo = !supabase || !session

  const loadStores = useCallback(async () => {
    if (!session) return

    const res = await fetch('/api/stores', { credentials: 'include' })
    if (!res.ok) {
      setStore(null)
      setStores([])
      setActiveStoreId(null)
      return
    }

    const data = await res.json() as {
      stores: UserStoreSummary[]
      activeStoreId: string | null
    }

    setStores(data.stores)
    setActiveStoreId(data.activeStoreId)

    const activeId = data.activeStoreId ?? data.stores[0]?.id
    if (activeId) {
      const full = await fetchFullStore(activeId)
      if (full) {
        setStore(full)
        return
      }
    }

    if (data.stores.length === 0 && supabase) {
      const created = await ensureUserStore(supabase, session.userId, session.name, session.email)
      if (created) {
        setStore(created)
        setStores([{
          id: created.id,
          name: created.name,
          slug: created.slug,
          avatar_url: created.avatar_url,
          banner_url: created.banner_url,
          owner_user_id: created.owner_user_id,
          role: 'owner',
        }])
        setActiveStoreId(created.id)
      }
    }
  }, [session, supabase])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (authLoading) return

    if (!supabase || !session) {
      setStore(DEMO_STORE_ROW)
      setStores([{
        id: DEMO_STORE_ROW.id,
        name: DEMO_STORE_ROW.name,
        slug: DEMO_STORE_ROW.slug,
        avatar_url: DEMO_STORE_ROW.avatar_url,
        banner_url: DEMO_STORE_ROW.banner_url,
        owner_user_id: DEMO_STORE_ROW.owner_user_id,
        role: 'owner',
      }])
      setActiveStoreId(DEMO_STORE_ROW.id)
      setLoading(false)
      return
    }

    setLoading(true)
    loadStores()
      .catch(() => {
        setStore(null)
        setStores([])
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId, authLoading, tick])
  /* eslint-enable react-hooks/set-state-in-effect */

  const refetch = useCallback(() => setTick(t => t + 1), [])

  const switchStore = useCallback(async (storeId: string): Promise<boolean> => {
    if (isDemo || switching) return false
    setSwitching(true)
    try {
      const res = await fetch('/api/stores/active', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Could not switch shop.')
        return false
      }

      const data = await res.json()
      setActiveStoreId(data.activeStoreId)
      const full = await fetchFullStore(storeId)
      if (full) setStore(full)

      setTick(t => t + 1)

      if (shouldLeaveDetailRoute(pathname)) {
        if (pathname.startsWith('/dashboard/products')) router.push('/dashboard/products')
        else if (pathname.startsWith('/dashboard/orders') || pathname.startsWith('/dashboard/sales')) {
          router.push('/dashboard/sales')
        } else {
          router.push('/dashboard')
        }
      } else {
        router.refresh()
      }

      return true
    } finally {
      setSwitching(false)
    }
  }, [isDemo, switching, pathname, router])

  const createStore = useCallback(async (input: { name: string; slug?: string }) => {
    if (isDemo) return { ok: false as const, error: 'Shop creation is unavailable in demo mode.' }

    const res = await fetch('/api/stores', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false as const, error: data.error ?? 'Could not create shop.' }
    }

    setActiveStoreId(data.activeStoreId)
    const full = await fetchFullStore(data.store.id)
    if (full) setStore(full)
    setTick(t => t + 1)
    router.refresh()
    return { ok: true as const }
  }, [isDemo, router])

  const saveStore = useCallback(
    async (patch: Database['public']['Tables']['stores']['Update']): Promise<string | null> => {
      if (!supabase || !session) return null

      let targetId = store?.id ?? activeStoreId
      if (!targetId) {
        const created = await ensureUserStore(supabase, session.userId, session.name, session.email)
        if (!created) return 'Could not find or create your shop. Please refresh and try again.'
        targetId = created.id
        setStore(created)
      }

      const doUpdate = async (p: typeof patch) =>
        supabase
          .from('stores')
          .update({ ...p, updated_at: new Date().toISOString() })
          .eq('id', targetId!)
          .select('*')
          .maybeSingle()

      let { data, error } = await doUpdate(patch)

      if (error?.message?.includes('column') && error.message.includes('does not exist')) {
        const safePatch: Database['public']['Tables']['stores']['Update'] = {}
        const knownCols = ['name', 'headline', 'bio', 'avatar_url', 'banner_url', 'social_links', 'support_email', 'header_layout']
        for (const k of knownCols) {
          if (k in patch) {
            (safePatch as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k]
          }
        }
        const retry = await doUpdate(safePatch)
        data = retry.data
        error = retry.error
      }

      if (error) return error.message
      if (!data) return 'Could not save your shop. Please try again.'

      setStore(data as StoreRow)
      setStores(prev => prev.map(s => s.id === data.id ? {
        ...s,
        name: data.name,
        slug: data.slug,
        avatar_url: data.avatar_url,
        banner_url: data.banner_url,
      } : s))
      return null
    },
    [session?.userId, store?.id, activeStoreId, supabase, session],
  )

  return {
    store,
    stores,
    activeStoreId,
    loading: authLoading || loading,
    switching,
    isDemo,
    refetch,
    saveStore,
    switchStore,
    createStore,
  }
}
