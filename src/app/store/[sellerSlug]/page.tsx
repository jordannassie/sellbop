import { notFound } from 'next/navigation'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { ClientStorefront } from './client-storefront'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) return { title: 'Store Not Found' }
  return {
    title: `${DEMO_STOREFRONT.title} — SellBop`,
    description: DEMO_STOREFRONT.bio ?? undefined,
    openGraph: {
      title: `${DEMO_STOREFRONT.title} — SellBop`,
      description: DEMO_STOREFRONT.bio ?? undefined,
    },
  }
}

export default async function StorefrontPage({ params }: { params: Promise<{ sellerSlug: string }> }) {
  const { sellerSlug } = await params
  if (sellerSlug !== DEMO_SELLER_PROFILE.slug) notFound()
  return <ClientStorefront sellerSlug={sellerSlug} />
}
