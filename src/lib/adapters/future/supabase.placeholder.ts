// ============================================================
// FUTURE: SUPABASE ADAPTER PLACEHOLDER
// When ready to connect Supabase, implement these classes.
// Each class mirrors the demo adapter but uses Supabase queries.
// See NEXT_BACKEND_INTEGRATION_STEPS.md for exact steps.
// ============================================================

// import { createClient } from '@supabase/supabase-js'
// import type { IProductRepository, IOrderRepository, ... } from '@/lib/repositories/interfaces'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

// export class SupabaseProductRepository implements IProductRepository {
//   async findAll(sellerId: string) {
//     const { data } = await supabase.from('products').select('*').eq('seller_id', sellerId)
//     return data ?? []
//   }
//   async findById(id: string) {
//     const { data } = await supabase.from('products').select('*').eq('id', id).single()
//     return data ?? null
//   }
//   // ... implement all methods
// }

// export const supabaseProductRepo = new SupabaseProductRepository()
// ... etc.

export {}
