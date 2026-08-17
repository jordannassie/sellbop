/**
 * Supabase Storage upload utilities.
 * Falls back gracefully when Supabase is not configured.
 *
 * Buckets (created by migration 006):
 *   store-images   — public  — store avatars / logos
 *   store-banners  — public  — store banner images
 *   product-images — public  — product cover/thumbnail images
 *   product-files  — private — downloadable product files (signed URLs)
 */

import { getSupabaseBrowserClient } from './client'

export type UploadBucket = 'store-images' | 'store-banners' | 'product-images' | 'product-files'

export interface UploadResult {
  url: string | null
  path: string | null
  error: string | null
}

/** Upload a File to a Supabase Storage bucket. Returns the public URL for public buckets. */
export async function uploadFile(
  bucket: UploadBucket,
  path: string,
  file: File,
): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    // Supabase not configured — return a local object URL so the UI still previews
    return { url: URL.createObjectURL(file), path: null, error: null }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    return { url: null, path: null, error: error.message }
  }

  // For public buckets, get the public URL; for private, store the path only.
  const isPublic = bucket !== 'product-files'
  if (isPublic) {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return { url: urlData.publicUrl, path: data.path, error: null }
  }

  return { url: null, path: data.path, error: null }
}

/** Generate a signed URL for a private bucket file (e.g. product-files). */
export async function getSignedUrl(
  bucket: UploadBucket,
  path: string,
  expiresInSeconds = 3600,
  options?: { download?: string | boolean },
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds, options)

  return error ? null : data.signedUrl
}

/** Build a unique storage path from an owner ID and filename. */
export function buildStoragePath(ownerId: string, fileName: string): string {
  const ext = fileName.split('.').pop() ?? 'bin'
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
  return `${ownerId}/${Date.now()}-${safe}.${ext}`.replace(/\.+$/, '')
}
