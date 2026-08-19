import { notFound } from 'next/navigation'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { canPubliclyViewStore } from '@/lib/partnerships/publication'
import { CanonicalProductPage } from './canonical-product-page'
import type { Metadata } from 'next'

const RESERVED = new Set([
  'dashboard','login','signup','marketplace','mission','terms','privacy',
  'refund-policy','support','start-selling','checkout','api','p','store',
  'internal','auth','purchases',
])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sellerSlug: string; productSlug: string }>
}): Promise<Metadata> {
  const { sellerSlug, productSlug } = await params
  if (RESERVED.has(sellerSlug)) return { title: 'Sellbop' }

  if (!isSupabaseAdminConfigured()) return { title: 'Product — Sellbop' }

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id, name')
    .eq('slug', sellerSlug)
    .maybeSingle()

  if (!store) return { title: 'Product not found — Sellbop' }

  const { data: product } = await admin
    .from('products')
    .select('title, short_description, description')
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_live', true)
    .maybeSingle()

  if (!product) return { title: 'Product not found — Sellbop' }

  return {
    title: `${product.title} — ${store.name}`,
    description: product.short_description ?? product.description?.slice(0, 160) ?? `${product.title} by ${store.name}`,
  }
}

export default async function CanonicalProductRoute({
  params,
}: {
  params: Promise<{ sellerSlug: string; productSlug: string }>
}) {
  const { sellerSlug, productSlug } = await params

  if (RESERVED.has(sellerSlug)) notFound()

  if (!isSupabaseAdminConfigured()) {
    return <CanonicalProductPage sellerSlug={sellerSlug} productSlug={productSlug} />
  }

  const admin = getSupabaseAdminClient()

  // Verify the store exists
  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('slug', sellerSlug)
    .maybeSingle()

  if (!store) notFound()

  const partnership = await getPartnershipByStoreId(store.id)
  if (!canPubliclyViewStore(partnership)) notFound()

  // Verify product belongs to that store
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_live', true)
    .maybeSingle()

  if (!product) notFound()

  return <CanonicalProductPage sellerSlug={sellerSlug} productSlug={productSlug} />
}
