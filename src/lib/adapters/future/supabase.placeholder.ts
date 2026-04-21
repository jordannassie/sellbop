// ─────────────────────────────────────────────────────────────────────────────
// FUTURE: Supabase Repository Implementations
//
// The Supabase client helpers are now live at:
//   src/lib/supabase/client.ts  — browser client (public anon key)
//   src/lib/supabase/server.ts  — server admin client (service role key)
//   src/lib/supabase/types.ts   — Database type definitions
//
// Schema: supabase/migrations/001_initial_schema.sql
//
// When ready to wire up the real database, implement repository classes here
// that mirror the interfaces in src/lib/repositories/ but use Supabase instead
// of localStorage.
//
// Example:
// ─────────────────────────────────────────────────────────────────────────────
//
// import { getSupabaseAdminClient } from '@/lib/supabase/server'
// import type { IProductRepository } from '@/lib/repositories/interfaces'
// import type { Product } from '@/lib/domain/entities'
//
// export class SupabaseProductRepository implements IProductRepository {
//   private get db() { return getSupabaseAdminClient() }
//
//   async findAll(storeId: string): Promise<Product[]> {
//     const { data, error } = await this.db
//       .from('products')
//       .select('*')
//       .eq('store_id', storeId)
//       .eq('is_live', true)
//     if (error) throw error
//     return (data ?? []).map(toProduct)  // normalise DB row → domain entity
//   }
//
//   async findById(id: string): Promise<Product | null> {
//     const { data } = await this.db
//       .from('products')
//       .select('*')
//       .eq('id', id)
//       .single()
//     return data ? toProduct(data) : null
//   }
//
//   // ... implement remaining interface methods
// }
//
// export const supabaseProductRepo = new SupabaseProductRepository()
// ─────────────────────────────────────────────────────────────────────────────

export {}
