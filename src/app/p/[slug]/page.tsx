import { DEMO_PRODUCTS, DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { ClientProductPage } from './client-product-page'
import { MarketingFooter } from '@/components/marketing/footer'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  // Seed products get precise metadata; Printify/dynamic products fall back gracefully
  const product = DEMO_PRODUCTS.find(p => p.slug === slug && p.status === 'published')
  if (!product) {
    return {
      title: 'Product — ' + DEMO_SELLER_PROFILE.displayName,
      description: 'View this product on SellBop.',
    }
  }
  return {
    title: product.seoTitle ?? `${product.name} — ${DEMO_SELLER_PROFILE.displayName}`,
    description: product.seoDescription ?? product.shortDescription ?? product.description.slice(0, 160),
  }
}

export default async function SellPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <>
      <ClientProductPage slug={slug} />
      <MarketingFooter />
    </>
  )
}
