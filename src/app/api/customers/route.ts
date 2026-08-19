import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { requireActiveStoreForUser, ActiveStoreError } from '@/lib/stores/active-store'

// GET /api/customers — derive customers from orders for the authenticated seller
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()

  let store
  try {
    store = await requireActiveStoreForUser(user.id)
  } catch (err) {
    if (err instanceof ActiveStoreError) return NextResponse.json({ customers: [] })
    throw err
  }

  const { data: orders, error } = await admin
    .from('orders')
    .select('id, buyer_email, buyer_name, total_cents, payment_status, created_at, product_title_snapshot, product_id')
    .eq('store_id', store.id)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by email
  const customerMap = new Map<string, {
    email: string
    name: string
    total_spend_cents: number
    purchase_count: number
    last_purchase_at: string
    order_ids: string[]
  }>()

  for (const order of orders ?? []) {
    if (!order.buyer_email) continue
    const email = order.buyer_email.toLowerCase()
    const existing = customerMap.get(email)
    if (existing) {
      existing.total_spend_cents += order.total_cents ?? 0
      existing.purchase_count += 1
      existing.order_ids.push(order.id)
      if (order.created_at > existing.last_purchase_at) {
        existing.last_purchase_at = order.created_at
      }
    } else {
      customerMap.set(email, {
        email,
        name: order.buyer_name ?? email.split('@')[0],
        total_spend_cents: order.total_cents ?? 0,
        purchase_count: 1,
        last_purchase_at: order.created_at,
        order_ids: [order.id],
      })
    }
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.last_purchase_at).getTime() - new Date(a.last_purchase_at).getTime()
  )

  return NextResponse.json({ customers })
}
