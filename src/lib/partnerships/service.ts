import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_STORE_BANNER_URL } from '@/lib/store-defaults'
import { validateStoreSlug } from '@/lib/store-slugs'
import { slugFromText } from '@/lib/supabase/ensure-user-store'
import { setActiveStoreCookie } from '@/lib/stores/active-store'
import { env } from '@/lib/env'
import { sendTransactionalEmail } from '@/lib/email/service'
import { INVITE_EXPIRY_DAYS, PREVIEW_EXPIRY_DAYS } from './constants'
import { generateSecureToken, hashToken } from './tokens'

export class PartnershipError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function createPartnerShop(input: {
  adminUserId: string
  shopName: string
  shopSlug?: string
  partnerName?: string
  partnerEmail?: string
}) {
  const shopName = input.shopName.trim()
  if (!shopName) throw new PartnershipError('Shop name is required.')

  const slug = input.shopSlug?.trim()
    ? slugFromText(input.shopSlug)
    : slugFromText(shopName)

  const slugError = validateStoreSlug(slug)
  if (slugError) throw new PartnershipError(slugError, 400)

  const admin = getSupabaseAdminClient()

  const { data: taken } = await admin.from('stores').select('id').eq('slug', slug).maybeSingle()
  if (taken) throw new PartnershipError('That shop URL is already taken.', 409)

  const { data, error } = await admin.rpc('create_partner_shop', {
    p_admin_user_id: input.adminUserId,
    p_shop_name: shopName,
    p_shop_slug: slug,
    p_partner_name: input.partnerName?.trim() || null,
    p_partner_email: input.partnerEmail?.trim().toLowerCase() || null,
    p_banner_url: DEFAULT_STORE_BANNER_URL,
    p_avatar_url: null,
  })

  if (error) {
    if (error.message.includes('create_partner_shop')) {
      throw new PartnershipError('Partnership system is not available yet. Apply migration 030.', 503)
    }
    throw new PartnershipError(error.message, 500)
  }

  const row = Array.isArray(data) ? data[0] : data
  const storeId = (row as { out_store_id?: string } | null)?.out_store_id
  const partnershipId = (row as { out_partnership_id?: string } | null)?.out_partnership_id

  if (!storeId || !partnershipId) {
    throw new PartnershipError('Could not create Partner Shop.', 500)
  }

  await setActiveStoreCookie(storeId)

  return { storeId, partnershipId, slug }
}

export async function generatePreviewLink(partnershipId: string, adminUserId: string) {
  const admin = getSupabaseAdminClient()
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PREVIEW_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await admin
    .from('partner_shop_preview_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('partnership_id', partnershipId)
    .is('revoked_at', null)

  const { error } = await admin.from('partner_shop_preview_tokens').insert({
    partnership_id: partnershipId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by_user_id: adminUserId,
  })

  if (error) throw new PartnershipError(error.message, 500)

  await admin
    .from('store_partnerships')
    .update({ status: 'preview', updated_at: new Date().toISOString() })
    .eq('id', partnershipId)
    .in('status', ['draft', 'preview'])

  const url = `${env.app.url}/preview/${token}`
  return { url, expiresAt }
}

export async function sendPartnerInvite(input: {
  partnershipId: string
  adminUserId: string
  partnerEmail: string
  partnerName?: string
  shopName: string
}) {
  const email = input.partnerEmail.trim().toLowerCase()
  if (!email) throw new PartnershipError('Partner email is required.')

  const admin = getSupabaseAdminClient()
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await admin
    .from('partner_shop_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('partnership_id', input.partnershipId)
    .is('revoked_at', null)
    .is('accepted_at', null)

  const { error: inviteError } = await admin.from('partner_shop_invites').insert({
    partnership_id: input.partnershipId,
    email,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by_user_id: input.adminUserId,
  })

  if (inviteError) throw new PartnershipError(inviteError.message, 500)

  await admin
    .from('store_partnerships')
    .update({
      partner_email: email,
      partner_name: input.partnerName?.trim() || null,
      status: 'invited',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.partnershipId)

  const claimUrl = `${env.app.url}/partner/claim/${token}`

  await sendTransactionalEmail({
    to: email,
    subject: 'Your SellBop Shop is ready',
    html: `
      <p>Hi ${input.partnerName?.trim() || 'there'},</p>
      <p>Your SellBop Partner Shop has been prepared and is ready for you.</p>
      <p><strong>${input.shopName}</strong></p>
      <p>Claim your Shop to access your dashboard and connect your payout account.</p>
      <p><a href="${claimUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Claim My Shop</a></p>
    `,
    text: `Your SellBop Partner Shop "${input.shopName}" is ready. Claim it here: ${claimUrl}`,
    idempotencyKey: `partner-invite/${input.partnershipId}/${tokenHash.slice(0, 16)}`,
    emailType: 'partner_shop_invite',
    metadata: { partnershipId: input.partnershipId },
  })

  return { claimUrl, expiresAt }
}

export async function claimPartnerShop(token: string, userId: string, userEmail: string) {
  const admin = getSupabaseAdminClient()
  const tokenHash = hashToken(token)

  const { data, error } = await admin.rpc('claim_partner_shop', {
    p_token_hash: tokenHash,
    p_user_id: userId,
    p_user_email: userEmail.trim().toLowerCase(),
  })

  if (error) {
    if (error.message.includes('claim_partner_shop')) {
      throw new PartnershipError('Claim system is not available yet. Apply migrations 029 and 030.', 503)
    }
    throw new PartnershipError(error.message, 500)
  }

  const result = (Array.isArray(data) ? data[0] : data) as { ok?: boolean; error?: string; store_id?: string } | null
  if (!result?.ok) {
    throw new PartnershipError(result?.error ?? 'Could not claim Shop.', 400)
  }

  if (result.store_id) {
    await setActiveStoreCookie(result.store_id)
  }

  return { storeId: result.store_id as string }
}

export async function validatePreviewToken(token: string) {
  const admin = getSupabaseAdminClient()
  const tokenHash = hashToken(token)

  const { data: row, error } = await admin
    .from('partner_shop_preview_tokens')
    .select('*, store_partnerships(*, stores(*))')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!row || row.revoked_at) return null
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null

  return row
}

export async function validateInviteToken(token: string) {
  const admin = getSupabaseAdminClient()
  const tokenHash = hashToken(token)

  const { data: invite, error } = await admin
    .from('partner_shop_invites')
    .select('*, store_partnerships(*, stores(name, slug))')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!invite || invite.revoked_at) return { valid: false as const, reason: 'invalid' as const }
  if (invite.accepted_at) return { valid: false as const, reason: 'accepted' as const }
  if (new Date(invite.expires_at) < new Date()) return { valid: false as const, reason: 'expired' as const }

  const partnership = invite.store_partnerships as {
    partner_name: string | null
    stores: { name: string; slug: string } | null
  } | null

  return {
    valid: true as const,
    invite,
    shopName: partnership?.stores?.name ?? 'Your Shop',
    partnerName: partnership?.partner_name,
    invitedEmail: invite.email,
  }
}
