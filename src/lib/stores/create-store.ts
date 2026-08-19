import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_STORE_BANNER_URL } from '@/lib/store-defaults'
import { validateStoreSlug } from '@/lib/store-slugs'
import { slugFromText } from '@/lib/supabase/ensure-user-store'
import { setActiveStoreCookie, type AccessibleStore } from './active-store'

export interface CreateStoreInput {
  name: string
  slug?: string
  avatarUrl?: string | null
}

export interface CreateStoreResult {
  store: AccessibleStore
}

async function generateUniqueSlug(base: string): Promise<string | null> {
  const admin = getSupabaseAdminClient()
  let slug = base

  for (let attempt = 1; attempt <= 20; attempt++) {
    const validationError = validateStoreSlug(slug)
    if (validationError) {
      slug = `${base}-${attempt + 1}`
      continue
    }

    const { data: taken } = await admin
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!taken) return slug
    slug = `${base}-${attempt + 1}`
  }

  return null
}

export async function createStoreForUser(
  userId: string,
  input: CreateStoreInput,
): Promise<CreateStoreResult> {
  const name = input.name.trim()
  if (!name) {
    throw new CreateStoreError('Shop name is required.', 400)
  }

  const rawSlug = input.slug?.trim()
    ? slugFromText(input.slug)
    : slugFromText(name)

  if (!rawSlug) {
    throw new CreateStoreError('Could not generate a valid shop URL.', 400)
  }

  const slugError = validateStoreSlug(rawSlug)
  if (slugError) {
    throw new CreateStoreError(slugError, 400)
  }

  const admin = getSupabaseAdminClient()

  let finalSlug = rawSlug
  const { data: slugTaken } = await admin
    .from('stores')
    .select('id')
    .eq('slug', rawSlug)
    .maybeSingle()

  if (slugTaken) {
    if (input.slug) {
      throw new CreateStoreError('That shop URL is already taken. Try a different one.', 409)
    }
    const uniqueSlug = await generateUniqueSlug(rawSlug)
    if (!uniqueSlug) {
      throw new CreateStoreError('That shop URL is already taken. Try a different one.', 409)
    }
    finalSlug = uniqueSlug
  }

  const { data: store, error: storeError } = await admin
    .from('stores')
    .insert({
      owner_user_id: userId,
      slug: finalSlug,
      name,
      banner_url: DEFAULT_STORE_BANNER_URL,
      avatar_url: input.avatarUrl ?? null,
    })
    .select('*')
    .single()

  if (storeError || !store) {
    throw new CreateStoreError(storeError?.message ?? 'Could not create shop.', 500)
  }

  await admin.from('store_members').upsert(
    {
      store_id: store.id,
      user_id: userId,
      role: 'owner',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'store_id,user_id' },
  ).then(() => undefined, () => undefined)

  await setActiveStoreCookie(store.id)

  return {
    store: { ...store, role: 'owner' },
  }
}

export class CreateStoreError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}
