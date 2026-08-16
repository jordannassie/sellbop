/**
 * Centralized Sellbop platform configuration.
 * All fee/limit values live here — never scattered throughout the code.
 */

/** Platform fee as a percentage (e.g. 5 = 5%). Set via SELLBOP_PLATFORM_FEE_PERCENT env var. */
export const SELLBOP_PLATFORM_FEE_PERCENT: number = parseFloat(
  process.env.SELLBOP_PLATFORM_FEE_PERCENT ?? '5'
)

/** Calculate the platform fee in cents for a given total. */
export function calcPlatformFeeCents(totalCents: number): number {
  return Math.round(totalCents * (SELLBOP_PLATFORM_FEE_PERCENT / 100))
}

/** Calculate the seller net payout in cents. */
export function calcSellerNetCents(totalCents: number): number {
  return totalCents - calcPlatformFeeCents(totalCents)
}

/** Maximum file size for product downloads (100 MB). */
export const MAX_PRODUCT_FILE_SIZE_BYTES = 100 * 1024 * 1024

/** Maximum cover image size (5 MB). */
export const MAX_COVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

/** Signed download URL expiry in seconds (1 hour). */
export const DOWNLOAD_URL_EXPIRY_SECONDS = 3600

/** Allowed product file MIME types. */
export const ALLOWED_PRODUCT_FILE_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'application/octet-stream',
  'text/plain',
  'application/json',
]
