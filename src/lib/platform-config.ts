/**
 * Centralized Sellbop platform configuration.
 */

export {
  calcPlatformFeeCents,
  calcSellerNetCents,
  calculateTransactionFees,
  DIRECT_FEE_FIXED_CENTS,
  DIRECT_FEE_PERCENT,
  MARKETPLACE_FEE_PERCENT,
  type FeeCalculationInput,
  type FeeCalculationResult,
  type SaleType,
} from '@/lib/pricing/fee-engine'

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
