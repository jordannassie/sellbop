import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MarketingFooter } from '@/components/marketing/footer'
import { ClientProductPage } from './client-product-page'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  if (!isSupabaseAdminConfigured()) {
    return { title: 'Product — Sellbop', description: 'View this product on Sellbop.' }
  }

  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('title, description, short_description, cover_image_url')
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle()

  if (!product) return { title: 'Product — Sellbop' }

  return {
    title: product.title + ' — Sellbop',
    description: product.short_description ?? product.description?.slice(0, 160) ?? 'View this product on Sellbop.',
    openGraph: product.cover_image_url ? { images: [product.cover_image_url] } : undefined,
  }
}

export default async function SellPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

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

  // Verify product exists server-side for proper 404
  const admin = getSupabaseAdminClient()
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle()

  if (!product) notFound()

  return (
    <>
      <Suspense>
        <ClientProductPage slug={slug} />
      </Suspense>
      <MarketingFooter />
    </>
  )
}
