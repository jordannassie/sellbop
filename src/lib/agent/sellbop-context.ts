/**
 * SellBop account snapshot builder.
 * Used by /api/agent/run to give the agent context about the user's account.
 * Server-side only — gracefully falls back to safe demo data on failure.
 */

import type { SellBopAccountSnapshot } from './types'

const DEMO_SNAPSHOT: SellBopAccountSnapshot = {
  user: {
    id: null,
    name: null,
    email: null,
    plan: 'free',
    creditsRemaining: 18,
  },
  store: {
    exists: false,
    published: false,
    name: null,
    slug: null,
    hasAvatar: false,
    hasBio: false,
    hasHeadline: false,
    hasBanner: false,
  },
  products: { count: 0, liveCount: 0, draftCount: 0 },
  payments: { stripeConnected: false },
  sales: { totalRevenue: 0, totalOrders: 0 },
  missingSteps: [
    'Add your store name',
    'Add a store photo',
    'Create your first product',
    'Connect payments',
    'Publish your store',
  ],
}

function computeMissingSteps(snap: Omit<SellBopAccountSnapshot, 'missingSteps'>): string[] {
  const steps: string[] = []

  if (!snap.store.name) steps.push('Add your store name')
  if (!snap.store.hasAvatar) steps.push('Add a store photo')
  if (!snap.store.hasBio) steps.push('Write a store bio')
  if (!snap.store.hasHeadline) steps.push('Add a store headline')
  if (snap.products.count === 0) steps.push('Create your first product')
  if (snap.products.count > 0 && !snap.payments.stripeConnected) steps.push('Connect payments')
  if (!snap.store.published) steps.push('Publish your store')
  if (snap.store.published && snap.sales.totalOrders === 0) steps.push('Create launch content')
  if (snap.sales.totalOrders > 0) steps.push('Create a bundle or membership')

  return steps
}

export async function buildSellBopAccountSnapshot(
  userId?: string | null,
): Promise<SellBopAccountSnapshot> {
  if (!userId) return DEMO_SNAPSHOT

  try {
    // Dynamic import keeps 'server-only' out of any client bundles
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // ── Fetch store ───────────────────────────────────────────
    const { data: storeRow } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle()

    // ── Fetch products ────────────────────────────────────────
    const { data: productRows } = storeRow
      ? await supabase
          .from('products')
          .select('id, is_live')
          .eq('store_id', storeRow.id)
      : { data: [] }

    const products = productRows ?? []
    const liveCount = products.filter((p: { is_live: boolean }) => p.is_live).length
    const draftCount = products.filter((p: { is_live: boolean }) => !p.is_live).length

    // ── Fetch profile ─────────────────────────────────────────
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', userId)
      .maybeSingle()

    const base: Omit<SellBopAccountSnapshot, 'missingSteps'> = {
      user: {
        id: userId,
        name: profileRow?.full_name ?? null,
        email: profileRow?.email ?? null,
        plan: 'free',
        creditsRemaining: 18,
      },
      store: {
        exists: Boolean(storeRow),
        published: false,   // stores table has no published column; default false
        name: storeRow?.name ?? null,
        slug: storeRow?.slug ?? null,
        hasAvatar: Boolean(storeRow?.avatar_url),
        hasBio: Boolean(storeRow?.bio),
        hasHeadline: Boolean(storeRow?.headline),
        hasBanner: Boolean(storeRow?.banner_url),
      },
      products: {
        count: products.length,
        liveCount,
        draftCount,
      },
      payments: { stripeConnected: false },
      sales: { totalRevenue: 0, totalOrders: 0 },
    }

    return { ...base, missingSteps: computeMissingSteps(base) }
  } catch {
    return DEMO_SNAPSHOT
  }
}
