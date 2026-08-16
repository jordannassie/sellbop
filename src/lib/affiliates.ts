/**
 * Shared affiliate utilities — referral code generation, commission math.
 */

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

/** Generate a cryptographically random referral code. */
export function generateReferralCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => CODE_CHARS[b % CODE_CHARS.length])
    .join('')
}

/** Calculate affiliate commission in cents (integer math). */
export function calcCommissionCents(
  grossCents: number,
  commissionPercent: number,
): number {
  return Math.floor(grossCents * (commissionPercent / 100))
}

/** Hold period in days before a commission becomes available. */
export const AFFILIATE_HOLD_DAYS: number = parseInt(
  process.env.AFFILIATE_HOLD_DAYS ?? '14',
)

/** Calculate the earliest date a commission becomes available. */
export function calcAvailableAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + AFFILIATE_HOLD_DAYS)
  return d
}

/** Attribution window in days. */
export const ATTRIBUTION_DAYS = 30
