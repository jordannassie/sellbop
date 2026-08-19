'use client'
/**
 * Shared active-shop state for the entire dashboard.
 * Single source of truth — all components subscribe to one provider instance.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
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
  /^\/dashboard\/customers\/[^/]+$/,
]

function shouldLeaveDetailRoute(pathname: string): boolean {
  return ENTITY_DETAIL_PATTERNS.some(p => p.test(pathname))
}

function safePathAfterSwitch(pathname: string): string {
  if (shouldLeaveDetailRoute(pathname)) {
    if (pathname.startsWith('/dashboard/products')) return '/dashboard/products'
    if (pathname.startsWith('/dashboard/orders') || pathname.startsWith('/dashboard/sales')) {
      return '/dashboard/sales'
    }
    if (pathname.startsWith('/dashboard/customers')) return '/dashboard/customers'
    return '/dashboard'
  }
  return pathname
}

export interface UseUserStoreResult {
  store: StoreRow | null
  stores: UserStoreSummary[]
  activeStoreId: string | null
  storeVersion: number
  loading: boolean
  switching: boolean
  isDemo: boolean
  refetch: () => void
  saveStore: (patch: Database['public']['Tables']['stores']['Update']) => Promise<string | null>
  switchStore: (storeId: string) => Promise<boolean>
  createStore: (input: { name: string; slug?: string }) => Promise<{ ok: true } | { ok: false; error: string }>
}

const UserStoreContext = createContext<UseUserStoreResult | null>(null)

async function fetchFullStore(storeId: string): Promise<StoreRow | null> {
  const res = await fetch(`/api/stores/${storeId}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  return data.store as StoreRow
}

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [store, setStore] = useState<StoreRow | null>(null)
  const [stores, setStores] = useState<UserStoreSummary[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [storeVersion, setStoreVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const loadGenerationRef = useRef(0)
  const switchGenerationRef = useRef(0)
  const supabase = getSupabaseBrowserClient()
  const isDemo = !supabase || !session

  const loadStores = useCallback(async () => {
    if (!session) return

    const generation = ++loadGenerationRef.current

    const res = await fetch('/api/stores', { credentials: 'include', cache: 'no-store' })
    if (generation !== loadGenerationRef.current) return

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      console.error('[UserStoreProvider] /api/stores failed:', res.status, errBody)
      toast.error(typeof errBody.error === 'string' ? errBody.error : 'Could not load your shops. Please refresh.')
      setStore(null)
      setStores([])
      setActiveStoreId(null)
      return
    }

    const data = await res.json() as {
      stores: UserStoreSummary[]
      activeStoreId: string | null
    }

    if (generation !== loadGenerationRef.current) return

    setStores(data.stores)
    setActiveStoreId(data.activeStoreId)

    const activeId = data.activeStoreId ?? data.stores[0]?.id
    if (activeId) {
      const full = await fetchFullStore(activeId)
      if (generation !== loadGenerationRef.current) return
      if (full) {
        setStore(full)
        return
      }
    }

    if (data.stores.length === 0 && supabase) {
      const pendingClaim = typeof window !== 'undefined'
        ? sessionStorage.getItem('sellbop_claim_token')
        : null
      if (!pendingClaim) {
        console.warn('[UserStoreProvider] no shops returned for authenticated user — skipping auto-create')
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
  }, [session?.userId, authLoading, loadStores])
  /* eslint-enable react-hooks/set-state-in-effect */

  const refetch = useCallback(() => {
    loadGenerationRef.current++
    void loadStores()
  }, [loadStores])

  const switchStore = useCallback(async (storeId: string): Promise<boolean> => {
    if (isDemo || switching) return false

    const switchGen = ++switchGenerationRef.current
    loadGenerationRef.current++
    setSwitching(true)

    try {
      const res = await fetch('/api/stores/active', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
        cache: 'no-store',
      })

      if (switchGen !== switchGenerationRef.current) return false

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Could not switch shop.')
        return false
      }

      const data = await res.json() as {
        activeStoreId: string
        store: UserStoreSummary
      }

      if (switchGen !== switchGenerationRef.current) return false

      setActiveStoreId(data.activeStoreId)
      setStores(prev => prev.map(s => s.id === data.store.id ? { ...s, ...data.store } : s))

      const full = await fetchFullStore(data.activeStoreId)
      if (switchGen !== switchGenerationRef.current) return false

      if (full) setStore(full)

      setStoreVersion(v => v + 1)

      const target = safePathAfterSwitch(pathname)
      router.replace(target)
      router.refresh()

      return true
    } finally {
      if (switchGen === switchGenerationRef.current) {
        setSwitching(false)
      }
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

    loadGenerationRef.current++
    setActiveStoreId(data.activeStoreId)
    const full = await fetchFullStore(data.store.id)
    if (full) setStore(full)
    setStoreVersion(v => v + 1)
    router.refresh()
    return { ok: true as const }
  }, [isDemo, router])

  const saveStore = useCallback(
    async (patch: Database['public']['Tables']['stores']['Update']): Promise<string | null> => {
      if (!supabase || !session) return null

      const targetId = store?.id ?? activeStoreId
      if (!targetId) {
        return 'No active shop selected. Please refresh and try again.'
      }

      const doUpdate = async (p: typeof patch) =>
        supabase
          .from('stores')
          .update({ ...p, updated_at: new Date().toISOString() })
          .eq('id', targetId)
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
    [store?.id, activeStoreId, supabase, session],
  )

  const value: UseUserStoreResult = {
    store,
    stores,
    activeStoreId,
    storeVersion,
    loading: authLoading || loading,
    switching,
    isDemo,
    refetch,
    saveStore,
    switchStore,
    createStore,
  }

  return (
    <UserStoreContext.Provider value={value}>
      {children}
    </UserStoreContext.Provider>
  )
}

const EMPTY_STORE_STATE: UseUserStoreResult = {
  store: null,
  stores: [],
  activeStoreId: null,
  storeVersion: 0,
  loading: false,
  switching: false,
  isDemo: true,
  refetch: () => {},
  saveStore: async () => 'Shop context unavailable.',
  switchStore: async () => false,
  createStore: async () => ({ ok: false as const, error: 'Shop context unavailable.' }),
}

export function useUserStore(): UseUserStoreResult {
  const ctx = useContext(UserStoreContext)
  if (!ctx) return EMPTY_STORE_STATE
  return ctx
}
