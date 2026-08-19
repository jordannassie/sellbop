import 'server-only'

import {
  isPartnerApplicationStatus,
  PARTNER_APPLICATION_STATUS_LABELS,
  type PartnerApplicationStatus,
} from '@/lib/partner-applications/constants'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export interface PartnerApplicationSummary {
  id: string
  name: string
  email: string
  phone: string | null
  audienceSize: string
  status: PartnerApplicationStatus
  createdAt: string
}

export interface PartnerApplicationDetail extends PartnerApplicationSummary {
  userId: string | null
  socialLinks: string
  message: string
  adminNotes: string
  updatedAt: string
}

function mapRow(row: Record<string, unknown>): PartnerApplicationDetail {
  const status = String(row.status ?? 'new')
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : null,
    socialLinks: String(row.social_links ?? ''),
    audienceSize: String(row.audience_size ?? ''),
    message: String(row.message ?? ''),
    status: isPartnerApplicationStatus(status) ? status : 'new',
    adminNotes: String(row.admin_notes ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

export async function getNewPartnerApplicationCount(): Promise<number> {
  const admin = getSupabaseAdminClient()
  const { count, error } = await admin
    .from('partner_applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) {
    if (error.message.includes('partner_applications')) return 0
    throw error
  }
  return count ?? 0
}

export async function getAdminPartnerApplications(options: {
  page: number
  pageSize: number
  q?: string
  filter?: string
}): Promise<{
  applications: PartnerApplicationSummary[]
  page: number
  totalPages: number
  total: number
}> {
  const admin = getSupabaseAdminClient()
  const pageSize = options.pageSize
  const page = options.page
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('partner_applications')
    .select('id, name, email, phone, audience_size, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options.filter && options.filter !== 'all') {
    if (isPartnerApplicationStatus(options.filter)) {
      query = query.eq('status', options.filter)
    } else {
      query = query.eq('audience_size', options.filter)
    }
  }

  const q = options.q?.trim()
  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  const total = count ?? 0
  const applications: PartnerApplicationSummary[] = (data ?? []).map(row => {
    const r = row as Record<string, unknown>
    const status = String(r.status ?? 'new')
    return {
      id: String(r.id),
      name: String(r.name ?? ''),
      email: String(r.email ?? ''),
      phone: r.phone ? String(r.phone) : null,
      audienceSize: String(r.audience_size ?? ''),
      status: isPartnerApplicationStatus(status) ? status : 'new',
      createdAt: String(r.created_at ?? ''),
    }
  })

  return {
    applications,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total,
  }
}

export async function getPartnerApplicationDetail(id: string): Promise<PartnerApplicationDetail | null> {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('partner_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function updatePartnerApplication(
  id: string,
  patch: { status?: PartnerApplicationStatus; adminNotes?: string },
): Promise<PartnerApplicationDetail> {
  const admin = getSupabaseAdminClient()
  const update: {
    updated_at: string
    status?: PartnerApplicationStatus
    admin_notes?: string
  } = {
    updated_at: new Date().toISOString(),
  }

  if (patch.status !== undefined) update.status = patch.status
  if (patch.adminNotes !== undefined) update.admin_notes = patch.adminNotes

  const { data, error } = await admin
    .from('partner_applications')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

export { PARTNER_APPLICATION_STATUS_LABELS }
