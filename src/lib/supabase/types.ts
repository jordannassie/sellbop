// ─────────────────────────────────────────────────────────────────────────────
// Supabase database type definitions
//
// These are manually maintained until `supabase gen types typescript` is wired
// into the CI pipeline. They mirror the schema in:
//   supabase/migrations/001_initial_schema.sql
//
// HOW TO REGENERATE (once Supabase CLI is set up):
//   npx supabase gen types typescript --project-id <your-project-id> \
//     --schema public > src/lib/supabase/types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          user_id: string
          slug: string
          name: string
          headline: string | null
          bio: string | null
          avatar_url: string | null
          header_layout: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          name: string
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          header_layout?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['stores']['Insert']>
      }

      products: {
        Row: {
          id: string
          store_id: string
          title: string
          slug: string
          product_type: string
          short_description: string | null
          description: string | null
          image_url: string | null
          price_cents: number | null
          min_price_cents: number | null
          max_price_cents: number | null
          external_source: string | null
          external_product_id: string | null
          fulfillment_provider: string | null
          is_live: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          title: string
          slug: string
          product_type: string
          short_description?: string | null
          description?: string | null
          image_url?: string | null
          price_cents?: number | null
          min_price_cents?: number | null
          max_price_cents?: number | null
          external_source?: string | null
          external_product_id?: string | null
          fulfillment_provider?: string | null
          is_live?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }

      product_variants: {
        Row: {
          id: string
          product_id: string
          external_variant_id: string | null
          color: string | null
          size: string | null
          sku: string | null
          retail_price_cents: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          external_variant_id?: string | null
          color?: string | null
          size?: string | null
          sku?: string | null
          retail_price_cents?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }

      store_product_visibility: {
        Row: {
          id: string
          store_id: string
          product_id: string
          is_visible: boolean
          is_featured: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          product_id: string
          is_visible?: boolean
          is_featured?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['store_product_visibility']['Insert']>
      }

      orders: {
        Row: {
          id: string
          store_id: string
          buyer_name: string | null
          buyer_email: string | null
          buyer_phone: string | null
          shipping_name: string | null
          shipping_address_1: string | null
          shipping_address_2: string | null
          shipping_city: string | null
          shipping_state: string | null
          shipping_postal_code: string | null
          shipping_country: string | null
          subtotal_cents: number
          shipping_cents: number
          total_cents: number
          status: string
          payment_status: string
          fulfillment_provider: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          buyer_name?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          shipping_name?: string | null
          shipping_address_1?: string | null
          shipping_address_2?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          shipping_postal_code?: string | null
          shipping_country?: string | null
          subtotal_cents: number
          shipping_cents?: number
          total_cents: number
          status?: string
          payment_status?: string
          fulfillment_provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }

      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_variant_id: string | null
          title: string
          quantity: number
          unit_price_cents: number
          line_total_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_variant_id?: string | null
          title: string
          quantity?: number
          unit_price_cents: number
          line_total_cents: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }

      printify_connections: {
        Row: {
          id: string
          user_id: string
          shop_id: string
          token_encrypted: string | null
          is_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_id: string
          token_encrypted?: string | null
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['printify_connections']['Insert']>
      }

      fulfillment_orders: {
        Row: {
          id: string
          order_id: string
          provider: string
          external_order_id: string | null
          status: string
          raw_response_json: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          external_order_id?: string | null
          status?: string
          raw_response_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['fulfillment_orders']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
