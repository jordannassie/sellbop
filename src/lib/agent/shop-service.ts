import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildStoragePath } from '@/lib/supabase/storage'
import { getAllowedAdminEmails } from '@/lib/env'
import { createStoreForUser } from '@/lib/stores/create-store'
import { createPartnerShop } from '@/lib/partnerships/service'
import { getPartnershipByStoreId } from '@/lib/partnerships/queries'
import { getLaunchChecklist } from '@/lib/partnerships/activation'
import { getCurrentFinancialTerms } from '@/lib/partnerships/financial-terms'
import { generatePreviewLink } from '@/lib/partnerships/service'
import { env } from '@/lib/env'
import { MAX_COVER_IMAGE_SIZE_BYTES } from '@/lib/platform-config'
import { requireScope, type AgentIdentity } from './auth'
import { listAuthorizedShops, resolveStoreForOperation, AgentShopAccessError } from './shop-access'
import { withActivityLog } from './activity-log'
import type { Database } from '@/lib/supabase/types'

type StoreRow = Database['public']['Tables']['stores']['Row']

async function isUserPlatformAdmin(userId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient()
  const { data } = await admin.auth.admin.getUserById(userId)
  const email = data.user?.email?.toLowerCase()
  return !!email && getAllowedAdminEmails().includes(email)
}

async function partnerContextForStore(storeId: string) {
  const partnership = await getPartnershipByStoreId(storeId)
  if (!partnership) return null

  let revenueTerms = null
  let checklist = null
  try {
    revenueTerms = await getCurrentFinancialTerms(partnership.id)
    checklist = await getLaunchChecklist(partnership.id)
  } catch {
    // migration may be unavailable in some envs
  }

  return {
    isPartnerShop: true,
    partnershipId: partnership.id,
    status: partnership.status,
    partnerUserId: partnership.partner_user_id,
    partnerName: partnership.partner_name,
    partnerEmail: partnership.partner_email,
    revenueTerms: revenueTerms ? {
      partnerShareBps: revenueTerms.partner_share_bps,
      sellbopShareBps: 10000 - revenueTerms.partner_share_bps,
      version: revenueTerms.version,
      acceptedAt: revenueTerms.accepted_at,
    } : null,
    activationChecklist: checklist,
  }
}

function formatShopSummary(store: StoreRow & { role?: string }, identity: AgentIdentity, partnership?: Awaited<ReturnType<typeof partnerContextForStore>>) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    avatar_url: store.avatar_url,
    banner_url: store.banner_url,
    bio: store.bio,
    headline: store.headline,
    support_email: store.support_email,
    social_links: store.social_links,
    layout_mode: store.layout_mode,
    branding_mode: store.branding_mode,
    stripe_connected: !!store.stripe_account_id,
    stripe_charges_enabled: store.stripe_charges_enabled,
    stripe_payouts_enabled: store.stripe_payouts_enabled,
    role: 'role' in store ? store.role : undefined,
    isSelectedShop: identity.storeId === store.id,
    partner: partnership,
  }
}

export async function listShops(identity: AgentIdentity) {
  requireScope(identity, 'shops:read')
  const stores = await listAuthorizedShops(identity)
  const results = []
  for (const store of stores) {
    const partner = await partnerContextForStore(store.id)
    results.push(formatShopSummary(store, identity, partner))
  }
  return { shops: results, access_mode: identity.accessMode, selected_shop_id: identity.storeId }
}

export async function getShop(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'shops:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const partner = await partnerContextForStore(store.id)
  return formatShopSummary(store, identity, partner)
}

export async function getShopBySlug(identity: AgentIdentity, slug: string) {
  requireScope(identity, 'shops:read')
  const admin = getSupabaseAdminClient()
  const { data: store } = await admin.from('stores').select('*').eq('slug', slug.trim()).maybeSingle()
  if (!store) throw new AgentShopAccessError('Store not found.', 404)
  return getShop(identity, store.id)
}

export async function createShop(
  identity: AgentIdentity,
  input: {
    name: string
    slug?: string
    bio?: string | null
    support_email?: string | null
    partner_mode?: boolean
    partner_name?: string | null
    partner_email?: string | null
    notes?: string | null
  },
) {
  requireScope(identity, 'shops:write')

  return withActivityLog(identity, 'create_shop', 'store', undefined, async () => {
    if (input.partner_mode) {
      const isAdmin = await isUserPlatformAdmin(identity.userId)
      if (!isAdmin) {
        throw new AgentShopAccessError('Only platform admins can create Partner Shops via agent.', 403)
      }
      const result = await createPartnerShop({
        adminUserId: identity.userId,
        shopName: input.name,
        shopSlug: input.slug,
        partnerName: input.partner_name ?? undefined,
        partnerEmail: input.partner_email ?? undefined,
      })
      if (input.bio || input.support_email) {
        const admin = getSupabaseAdminClient()
        await admin.from('stores').update({
          bio: input.bio?.trim() ?? null,
          support_email: input.support_email?.trim() ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', result.storeId)
      }
      const store = await getShop(identity, result.storeId)
      return { result: store, after: store }
    }

    const { store } = await createStoreForUser(identity.userId, {
      name: input.name,
      slug: input.slug,
      supportEmail: input.support_email,
    })

    if (input.bio?.trim()) {
      const admin = getSupabaseAdminClient()
      await admin.from('stores').update({
        bio: input.bio.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', store.id)
    }

    const full = await getShop(identity, store.id)
    return { result: full, after: full }
  }, undefined)
}

export async function updateShop(
  identity: AgentIdentity,
  shopId: string | undefined,
  patch: Partial<{
    name: string
    bio: string | null
    headline: string | null
    support_email: string | null
    social_links: Record<string, string> | null
    layout_mode: string | null
    branding_mode: string | null
  }>,
) {
  requireScope(identity, 'shops:write')

  return withActivityLog(identity, 'update_shop', 'store', shopId, async () => {
    const before = await resolveStoreForOperation(identity, shopId)
    const admin = getSupabaseAdminClient()
    const update: Database['public']['Tables']['stores']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (patch.name !== undefined) update.name = patch.name.trim()
    if (patch.bio !== undefined) update.bio = patch.bio
    if (patch.headline !== undefined) update.headline = patch.headline
    if (patch.support_email !== undefined) update.support_email = patch.support_email
    if (patch.social_links !== undefined) update.social_links = patch.social_links
    if (patch.layout_mode !== undefined) update.layout_mode = patch.layout_mode
    if (patch.branding_mode !== undefined) update.branding_mode = patch.branding_mode

    const { data: store, error } = await admin
      .from('stores')
      .update(update)
      .eq('id', before.id)
      .select('*')
      .single()

    if (error) throw new AgentShopAccessError(error.message, 500)
    const partner = await partnerContextForStore(store.id)
    const result = formatShopSummary(store, identity, partner)
    return { result, before, after: result, storeId: store.id }
  }, shopId)
}

function decodeBase64(base64Data: string): Buffer {
  return Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64')
}

async function uploadStoreImage(
  identity: AgentIdentity,
  shopId: string | undefined,
  field: 'avatar_url' | 'banner_url',
  input: { fileName: string; mimeType: string; base64Data: string },
) {
  requireScope(identity, 'shops:write')
  const action = field === 'avatar_url' ? 'set_shop_avatar' : 'set_shop_banner'

  return withActivityLog(identity, action, 'store', shopId, async () => {
    const store = await resolveStoreForOperation(identity, shopId)
    if (!input.mimeType.startsWith('image/')) {
      throw new AgentShopAccessError('Only image files are supported.', 400)
    }
    const buffer = decodeBase64(input.base64Data)
    if (buffer.byteLength > MAX_COVER_IMAGE_SIZE_BYTES) {
      throw new AgentShopAccessError('Image exceeds the 5 MB limit.', 400)
    }

    const admin = getSupabaseAdminClient()
    const path = buildStoragePath(store.owner_user_id, input.fileName)
    const { error: uploadError } = await admin.storage
      .from('product-images')
      .upload(path, buffer, { contentType: input.mimeType, upsert: true })
    if (uploadError) throw new AgentShopAccessError(uploadError.message, 500)

    const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)
    const imageUrl = urlData.publicUrl

    const { data: updated, error } = await admin
      .from('stores')
      .update({ [field]: imageUrl, updated_at: new Date().toISOString() } as Database['public']['Tables']['stores']['Update'])
      .eq('id', store.id)
      .select('*')
      .single()

    if (error) throw new AgentShopAccessError(error.message, 500)
    const partner = await partnerContextForStore(updated.id)
    const result = formatShopSummary(updated, identity, partner)
    return { result, before: store, after: result, storeId: store.id }
  }, shopId)
}

export const setShopAvatar = (identity: AgentIdentity, shopId: string | undefined, input: { fileName: string; mimeType: string; base64Data: string }) =>
  uploadStoreImage(identity, shopId, 'avatar_url', input)

export const setShopBanner = (identity: AgentIdentity, shopId: string | undefined, input: { fileName: string; mimeType: string; base64Data: string }) =>
  uploadStoreImage(identity, shopId, 'banner_url', input)

export async function getStorefrontConfiguration(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'shops:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const admin = getSupabaseAdminClient()
  const { count: productCount } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id)

  const { count: liveCount } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id)
    .eq('is_live', true)

  const partner = await partnerContextForStore(store.id)
  const publicUrl = partner?.status === 'active'
    ? `${env.app.url}/store/${store.slug}`
    : null

  return {
    shop_id: store.id,
    slug: store.slug,
    name: store.name,
    headline: store.headline,
    bio: store.bio,
    avatar_url: store.avatar_url,
    banner_url: store.banner_url,
    social_links: store.social_links,
    layout_mode: store.layout_mode,
    branding_mode: store.branding_mode,
    product_count: productCount ?? 0,
    live_product_count: liveCount ?? 0,
    public_store_url: publicUrl,
    partner,
  }
}

export async function getShopPreviewUrl(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'shops:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const partner = await partnerContextForStore(store.id)

  if (partner) {
    const { userCanManageStore } = await import('@/lib/stores/active-store')
    const canManage = await userCanManageStore(identity.userId, store.id)
    if (!canManage) {
      throw new AgentShopAccessError('Not authorized to generate preview for this shop.', 403)
    }
    if (partner.status !== 'active') {
      const { url } = await generatePreviewLink(partner.partnershipId, identity.userId)
      return { preview_url: url, shop_id: store.id, is_partner_shop: true, is_public: false }
    }
    return { preview_url: `${env.app.url}/store/${store.slug}`, shop_id: store.id, is_partner_shop: true, is_public: true }
  }

  return {
    preview_url: `${env.app.url}/store/${store.slug}`,
    shop_id: store.id,
    is_partner_shop: false,
    is_public: true,
  }
}

export async function auditShop(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'shops:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const admin = getSupabaseAdminClient()

  const { data: products } = await admin
    .from('products')
    .select('id, title, slug, description, short_description, price_cents, cover_image_url, is_live, affiliate_enabled, affiliate_commission_percent, marketplace_listing, sort_order')
    .eq('store_id', store.id)
    .order('sort_order', { ascending: true })

  const rows = products ?? []
  const productIds = rows.map(p => p.id)

  const { data: files } = productIds.length
    ? await admin.from('product_files').select('product_id, file_type, file_name').in('product_id', productIds)
    : { data: [] }

  const { data: media } = productIds.length
    ? await admin.from('product_media').select('product_id').in('product_id', productIds)
    : { data: [] }

  const filesByProduct = new Map<string, Array<{ file_type: string | null; file_name: string | null }>>()
  for (const f of files ?? []) {
    const list = filesByProduct.get(f.product_id) ?? []
    list.push({ file_type: f.file_type, file_name: f.file_name })
    filesByProduct.set(f.product_id, list)
  }

  const galleryCountByProduct = new Map<string, number>()
  for (const m of media ?? []) {
    galleryCountByProduct.set(m.product_id, (galleryCountByProduct.get(m.product_id) ?? 0) + 1)
  }

  const missingImages = rows.filter(p => !p.cover_image_url).map(p => ({ id: p.id, title: p.title }))
  const missingFiles = rows.filter(p => !(filesByProduct.get(p.id)?.length)).map(p => ({ id: p.id, title: p.title }))
  const missingDescriptions = rows.filter(p => !p.description?.trim()).map(p => ({ id: p.id, title: p.title }))
  const missingPrices = rows.filter(p => !p.price_cents || p.price_cents <= 0).map(p => ({ id: p.id, title: p.title }))

  const titleCounts = new Map<string, number>()
  for (const p of rows) {
    const key = p.title.trim().toLowerCase()
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1)
  }
  const duplicateTitles = rows
    .filter(p => (titleCounts.get(p.title.trim().toLowerCase()) ?? 0) > 1)
    .map(p => p.title)

  const partner = await partnerContextForStore(store.id)
  const preview = await getShopPreviewUrl(identity, store.id).catch(() => null)

  const issues: string[] = []
  if (!store.name?.trim()) issues.push('Shop name missing')
  if (!store.avatar_url) issues.push('Shop avatar missing')
  if (!store.banner_url) issues.push('Shop banner missing')
  if (missingImages.length) issues.push(`${missingImages.length} product(s) missing images`)
  if (missingFiles.length) issues.push(`${missingFiles.length} product(s) missing delivery files`)
  if (missingDescriptions.length) issues.push(`${missingDescriptions.length} product(s) missing descriptions`)
  if (missingPrices.length) issues.push(`${missingPrices.length} product(s) missing prices`)

  return {
    shop_id: store.id,
    shop_name: store.name,
    identity_complete: !!(store.name?.trim() && store.bio?.trim()),
    avatar_present: !!store.avatar_url,
    banner_present: !!store.banner_url,
    product_count: rows.length,
    draft_count: rows.filter(p => !p.is_live).length,
    live_count: rows.filter(p => p.is_live).length,
    missing_images: missingImages,
    missing_files: missingFiles,
    missing_descriptions: missingDescriptions,
    missing_prices: missingPrices,
    affiliate_enabled_count: rows.filter(p => p.affiliate_enabled).length,
    marketplace_listed_count: rows.filter(p => p.marketplace_listing).length,
    duplicate_titles: [...new Set(duplicateTitles)],
    product_sort_order: rows.map(p => ({ id: p.id, title: p.title, sort_order: p.sort_order })),
    products: rows.map(p => {
      const productFiles = filesByProduct.get(p.id) ?? []
      const pdfFiles = productFiles.filter(f => (f.file_type ?? '').includes('pdf') || (f.file_name ?? '').toLowerCase().endsWith('.pdf'))
      return {
        id: p.id,
        title: p.title,
        cover_image_present: !!p.cover_image_url,
        gallery_images_count: galleryCountByProduct.get(p.id) ?? 0,
        delivery_file_present: productFiles.length > 0,
        generated_pdf_present: pdfFiles.length > 0,
        price_present: !!p.price_cents && p.price_cents > 0,
        description_present: !!p.description?.trim(),
        affiliate_configured: !!p.affiliate_enabled,
        is_draft: !p.is_live,
        is_live: !!p.is_live,
      }
    }),
    preview_url: preview?.preview_url ?? null,
    partner,
    issues,
    ready_for_review: issues.length === 0 && rows.length > 0,
  }
}

export async function getShopSnapshot(identity: AgentIdentity, shopId?: string) {
  requireScope(identity, 'shops:read')
  const store = await resolveStoreForOperation(identity, shopId)
  const admin = getSupabaseAdminClient()

  const { data: products } = await admin
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('sort_order', { ascending: true })

  const productIds = (products ?? []).map(p => p.id)
  const [{ data: files }, { data: media }] = await Promise.all([
    productIds.length
      ? admin.from('product_files').select('*').in('product_id', productIds)
      : Promise.resolve({ data: [] }),
    productIds.length
      ? admin.from('product_media').select('*').in('product_id', productIds).order('sort_order')
      : Promise.resolve({ data: [] }),
  ])

  type ProductFileRow = Database['public']['Tables']['product_files']['Row']
  type ProductMediaRow = Database['public']['Tables']['product_media']['Row']

  const filesByProduct: Record<string, ProductFileRow[]> = {}
  for (const f of files ?? []) {
    if (!filesByProduct[f.product_id]) filesByProduct[f.product_id] = []
    filesByProduct[f.product_id]!.push(f)
  }

  const mediaByProduct: Record<string, ProductMediaRow[]> = {}
  for (const m of media ?? []) {
    if (!mediaByProduct[m.product_id]) mediaByProduct[m.product_id] = []
    mediaByProduct[m.product_id]!.push(m)
  }

  const partner = await partnerContextForStore(store.id)
  const preview = await getShopPreviewUrl(identity, store.id).catch(() => null)

  return {
    shop: formatShopSummary(store, identity, partner),
    storefront: await getStorefrontConfiguration(identity, store.id),
    preview_url: preview?.preview_url ?? null,
    products: (products ?? []).map(p => {
      const productFiles = filesByProduct[p.id] ?? []
      const pdfFiles = productFiles.filter(f => (f.file_type ?? '').includes('pdf') || (f.file_name ?? '').toLowerCase().endsWith('.pdf'))
      return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      price_cents: p.price_cents,
      sale_enabled: p.sale_enabled,
      sale_price_cents: p.sale_price_cents,
      is_live: p.is_live,
      category: p.category,
      affiliate_enabled: p.affiliate_enabled,
      affiliate_commission_percent: p.affiliate_commission_percent,
      marketplace_listing: p.marketplace_listing,
      has_cover_image: !!p.cover_image_url,
      cover_image_present: !!p.cover_image_url,
      has_description: !!p.description?.trim(),
      description_present: !!p.description?.trim(),
      file_count: productFiles.length,
      delivery_file_present: productFiles.length > 0,
      generated_pdf_present: pdfFiles.length > 0,
      gallery_image_count: mediaByProduct[p.id]?.length ?? 0,
      price_present: !!p.price_cents && p.price_cents > 0,
      affiliate_configured: !!p.affiliate_enabled,
      is_draft: !p.is_live,
      sort_order: p.sort_order,
    }}),
  }
}
