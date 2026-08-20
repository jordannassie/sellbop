import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { normalizeStoreSlug, validateStoreSlug } from '@/lib/store-slugs'
import { userCanManageStore } from '@/lib/stores/active-store'

export type SlugAvailabilityResult = {
  slug: string
  available: boolean
  reason?: string
}

export async function checkStoreSlugAvailability(
  rawSlug: string,
  opts?: { storeId?: string; ownerId?: string },
): Promise<SlugAvailabilityResult> {
  const slug = normalizeStoreSlug(rawSlug)
  const validationError = validateStoreSlug(slug)
  if (validationError) {
    return { slug, available: false, reason: validationError }
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return { slug, available: true }
  }

  const { data, error } = await admin
    .from('stores')
    .select('id, owner_user_id')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return { slug, available: true }
  }

  if (opts?.storeId && data.id === opts.storeId) {
    return { slug, available: true }
  }

  if (opts?.ownerId && data.owner_user_id === opts.ownerId) {
    return { slug, available: true }
  }

  return { slug, available: false, reason: 'This store link is already taken.' }
}

export class StoreSlugError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function updateStoreSlugForUser(
  userId: string,
  storeId: string,
  rawSlug: string,
): Promise<{ storeId: string; slug: string; previousSlug: string }> {
  const canManage = await userCanManageStore(userId, storeId)
  if (!canManage) {
    throw new StoreSlugError('You do not have permission to update this shop.', 403)
  }

  const admin = getSupabaseAdminClient()
  const { data: existing, error: fetchError } = await admin
    .from('stores')
    .select('id, slug')
    .eq('id', storeId)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new StoreSlugError('Shop not found.', 404)
  }

  const availability = await checkStoreSlugAvailability(rawSlug, { storeId })
  if (!availability.available) {
    throw new StoreSlugError(availability.reason ?? 'This store link is unavailable.', 400)
  }

  if (availability.slug === existing.slug) {
    return { storeId: existing.id, slug: existing.slug, previousSlug: existing.slug }
  }

  const { data: updated, error: updateError } = await admin
    .from('stores')
    .update({ slug: availability.slug, updated_at: new Date().toISOString() })
    .eq('id', storeId)
    .select('id, slug')
    .single()

  if (updateError) {
    if (updateError.message.toLowerCase().includes('unique')) {
      throw new StoreSlugError('This store link is already taken.', 409)
    }
    throw new StoreSlugError('Could not update shop URL. Please try again.', 500)
  }

  return {
    storeId: updated.id,
    slug: updated.slug,
    previousSlug: existing.slug,
  }
}
