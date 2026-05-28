import { notFound } from 'next/navigation'
import { DEMO_SELLER_PROFILE, DEMO_STOREFRONT } from '@/lib/demo-data/seed'
import { isSupabaseConfigured } from '@/lib/env'
import { getDemoMode } from '@/lib/server/demo-mode'
import { ClientStorefront } from './client-storefront'
import type { Metadata } from 'next'
import type { Storefront, Product } from '@/lib/domain/entities'
import {
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_VISIBILITY,
} from '@/lib/domain/entities'
import type { Database } from '@/lib/supabase/types'

type StoreRow    = Database['public']['Tables']['stores']['Row']
type ProductRow  = Database['public']['Tables']['products']['Row']

/** Map a Supabase stores row to the Storefront domain entity. */
function mapStorefront(row: StoreRow): Storefront {
  return {
    id:                  row.id,
    sellerId:            row.owner_user_id,
    slug:                row.slug,
    title:               row.name,
    headline:            row.headline,
    bio:                 row.bio,
    avatarUrl:           row.avatar_url,
    bannerUrl:           row.banner_url,
    // Defaults — not yet stored per-store in the DB
    themeColor:          '#000000',
    buttonStyle:         'rounded',
    cardStyle:           'minimal',
    headerLayout:        (row.header_layout as Storefront['headerLayout']) ?? 'left_avatar',
    cardDensity:         'comfortable',
    sectionOrder:        DEFAULT_SECTION_ORDER,
    sectionVisibility:   DEFAULT_SECTION_VISIBILITY,
    featuredProductIds:  [],
    productOrder:        [],
    hiddenProductIds:    [],
    socialLinks:         {},
    headerMedia:         row.banner_url ? 'photo' : 'none',
    headerPhotoUrl:      row.banner_url,
    headerVideoUrl:      null,
    published:           true,
    brandingMode:        (row.branding_mode as Storefront['brandingMode']) ?? 'minimal',
  }
}

/** Map a Supabase products row to the Product domain entity. */
function mapProduct(row: ProductRow, sellerId: string): Product {
  return {
    id:                    row.id,
    sellerId,
    name:                  row.title,
    slug:                  row.slug,
    description:           '',
    shortDescription:      row.short_description,
    productType:           row.product_type as Product['productType'],
    status:                'published',
    price:                 (row.price_cents ?? 0) / 100,
    compareAtPrice:        null,
    currency:              'USD',
    thumbnailUrl:          row.cover_image_url ?? row.image_url,
    coverImageUrl:         row.cover_image_url,
    galleryImageUrls:      [],
    category:              null,
    tags:                  [],
    fileAssetIds:          [],
    externalUrl:           null,
    confirmationMessage:   null,
    supportEmail:          null,
    ctaText:               'Get now',
    seoTitle:              null,
    seoDescription:        null,
    licenseKeyEnabled:     false,
    memberAccessEnabled:   false,
    downloadLimit:         null,
    accessExpirationDays:  null,
    variants:              [],
    salesCount:            0,
    viewCount:             0,
    publishedAt:           row.created_at,
    createdAt:             row.created_at,
    updatedAt:             row.updated_at,
    marketplaceVisible:    row.marketplace_visible ?? true,
    marketplaceExcerpt:    row.marketplace_excerpt,
  }
}

/** Attempt to load a real store + its live products from Supabase. Returns null on any failure. */
async function loadRealStore(
  slug: string,
): Promise<{ storefront: Storefront; products: Product[] } | null> {
  if (!isSupabaseConfigured()) return null

  try {
    // Dynamic import keeps server-only cookie code out of the build when Supabase is unconfigured
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (storeErr || !store) return null

    // Pull owner's profile avatar — more up-to-date than store.avatar_url
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('user_id', store.owner_user_id)
      .maybeSingle()

    const { data: productRows } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_live', true)

    // Prefer profile avatar; fall back to store.avatar_url
    const storefront = mapStorefront({
      ...store,
      avatar_url: profile?.avatar_url ?? store.avatar_url,
    })
    const products   = (productRows ?? []).map(p => mapProduct(p, store.owner_user_id))

    return { storefront, products }
  } catch {
    return null
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ sellerSlug: string }> },
): Promise<Metadata> {
  const { sellerSlug } = await params

  const real = await loadRealStore(sellerSlug)
  if (real) {
    return {
      title: `${real.storefront.title} — SellBop`,
      description: real.storefront.bio ?? undefined,
      openGraph: {
        title: `${real.storefront.title} — SellBop`,
        description: real.storefront.bio ?? undefined,
      },
    }
  }

  const demoEnabled = await getDemoMode()
  if (demoEnabled && sellerSlug === DEMO_SELLER_PROFILE.slug) {
    return {
      title: `${DEMO_STOREFRONT.title} — SellBop`,
      description: DEMO_STOREFRONT.bio ?? undefined,
      openGraph: {
        title: `${DEMO_STOREFRONT.title} — SellBop`,
        description: DEMO_STOREFRONT.bio ?? undefined,
      },
    }
  }

  return { title: 'Store Not Found' }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StorefrontPage(
  { params }: { params: Promise<{ sellerSlug: string }> },
) {
  const { sellerSlug } = await params

  // 1. Try real store from Supabase
  const real = await loadRealStore(sellerSlug)
  if (real) {
    return (
      <ClientStorefront
        sellerSlug={sellerSlug}
        initialStorefront={real.storefront}
        initialProducts={real.products}
      />
    )
  }

  // 2. Demo fallback — only when demo mode is ON and this is the known demo slug
  const demoEnabled = await getDemoMode()
  if (demoEnabled && sellerSlug === DEMO_SELLER_PROFILE.slug) {
    return <ClientStorefront sellerSlug={sellerSlug} />
  }

  // 3. Nothing found → 404
  notFound()
}
