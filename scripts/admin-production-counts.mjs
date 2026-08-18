#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

async function count(table) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) return `error: ${error.message}`
  return count ?? 0
}

const [users, products, orders, purchases, sellers] = await Promise.all([
  count('profiles'),
  count('products'),
  count('orders'),
  count('purchases'),
  count('stores'),
])

const { buyers } = await import('../src/lib/admin/buyers.ts').then(() => null).catch(() => null)

console.log(JSON.stringify({ users, sellers, products, orders, purchases }, null, 2))
