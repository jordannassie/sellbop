import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/env'
import {
  DEFAULT_HOME_CARDS,
  DEFAULT_RESOURCE_PAGES,
  withDefaults,
} from './defaults'
import type { ResourceCardRow, ResourcePageRow } from './types'

export async function fetchHomeCards(): Promise<ResourceCardRow[]> {
  if (!isSupabaseAdminConfigured()) {
    return withDefaults<ResourceCardRow>(DEFAULT_HOME_CARDS)
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('resource_cards')
    .select('*')
    .eq('page_slug', 'home')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error || !data?.length) {
    return withDefaults<ResourceCardRow>(DEFAULT_HOME_CARDS)
  }

  return data as ResourceCardRow[]
}

export async function fetchResourcePage(slug: string): Promise<ResourcePageRow | null> {
  if (!isSupabaseAdminConfigured()) {
    const fallback = DEFAULT_RESOURCE_PAGES.find(p => p.slug === slug)
    if (!fallback) return null
    return withDefaults<ResourcePageRow>([fallback])[0] ?? null
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('resource_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) {
    const fallback = DEFAULT_RESOURCE_PAGES.find(p => p.slug === slug)
    if (!fallback) return null
    return withDefaults<ResourcePageRow>([fallback])[0] ?? null
  }

  return data as ResourcePageRow
}

export async function fetchAllResourcePages(): Promise<ResourcePageRow[]> {
  if (!isSupabaseAdminConfigured()) {
    return withDefaults<ResourcePageRow>(DEFAULT_RESOURCE_PAGES)
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('resource_pages')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) {
    return withDefaults<ResourcePageRow>(DEFAULT_RESOURCE_PAGES)
  }

  return data as ResourcePageRow[]
}

export async function fetchAllResourceCards(): Promise<ResourceCardRow[]> {
  if (!isSupabaseAdminConfigured()) {
    return withDefaults<ResourceCardRow>(DEFAULT_HOME_CARDS)
  }

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('resource_cards')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) {
    return withDefaults<ResourceCardRow>(DEFAULT_HOME_CARDS)
  }

  return data as ResourceCardRow[]
}
