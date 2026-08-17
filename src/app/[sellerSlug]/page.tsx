import { notFound } from 'next/navigation'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { ClientStorefront } from './client-storefront'
import { MarketingFooter } from '@/components/marketing/footer'
import type { Metadata } from 'next'

// Reserved top-level slugs that should NOT be treated as store slugs
const RESERVED = new Set([
  'dashboard','login','signup','marketplace','mission','terms','privacy',
  'refund-policy','support','start-selling','checkout','api','p','store',
  'internal','auth','purchases',
])

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (RESERVED.has(sellerSlug)) return { title: 'Sellbop' }

  if (!isSupabaseAdminConfigured()) return { title: 'Store — Sellbop' }

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('name, bio')
    .eq('slug', sellerSlug)
    .maybeSingle()

  if (!store) return { title: 'Store not found — Sellbop' }
  return {
    title: `${store.name} — Sellbop`,
    description: store.bio ?? `${store.name}'s digital products on Sellbop.`,
  }
}

export default async function SellerStorefrontPage({ params }: { params: Promise<{ sellerSlug: string }> }) {
  const { sellerSlug } = await params

  if (RESERVED.has(sellerSlug)) notFound()

  if (!isSupabaseAdminConfigured()) {
    return (
      <>
        <ClientStorefront slug={sellerSlug} />
        <MarketingFooter />
      </>
    )
  }

  const admin = getSupabaseAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('id')
    .eq('slug', sellerSlug)
    .maybeSingle()

  if (!store) notFound()

  return (
    <>
      <ClientStorefront slug={sellerSlug} />
      <MarketingFooter />
    </>
  )
}
