import { redirect } from 'next/navigation'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { Suspense } from 'react'
import { ClientProductPage } from './client-product-page'
import { MarketingFooter } from '@/components/marketing/footer'

/**
 * /p/[slug] — legacy product URL.
 *
 * If the product can be unambiguously resolved to a store,
 * redirect permanently to the canonical /[sellerSlug]/[productSlug].
 *
 * If Supabase is not configured (local dev), fall back to the old client component.
 */
export default async function LegacyProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams

  if (!isSupabaseAdminConfigured()) {
    return (
      <>
        <Suspense>
          <ClientProductPage slug={slug} />
        </Suspense>
        <MarketingFooter />
      </>
    )
  }

  const admin = getSupabaseAdminClient()

  // Find the product and its store
  const { data: product } = await admin
    .from('products')
    .select('id, slug, store_id')
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle()

  if (product?.store_id) {
    const { data: store } = await admin
      .from('stores')
      .select('slug')
      .eq('id', product.store_id)
      .maybeSingle()

    if (store?.slug) {
      // Build canonical URL preserving query params (e.g. ?ref=)
      const qp = new URLSearchParams(sp).toString()
      const canonical = `/${store.slug}/${slug}${qp ? `?${qp}` : ''}`
      redirect(canonical)
    }
  }

  // Fallback: serve old product page if store can't be resolved
  return (
    <>
      <Suspense>
        <ClientProductPage slug={slug} />
      </Suspense>
      <MarketingFooter />
    </>
  )
}
