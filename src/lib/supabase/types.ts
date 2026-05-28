export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }

      stores: {
        Row: {
          id: string
          owner_user_id: string
          slug: string
          name: string
          headline: string | null
          bio: string | null
          avatar_url: string | null
          header_layout: string | null
          banner_url: string | null
          layout_mode: string | null
          branding_mode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          slug: string
          name: string
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          header_layout?: string | null
          banner_url?: string | null
          layout_mode?: string | null
          branding_mode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['stores']['Insert']>
        Relationships: []
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
          marketplace_visible: boolean | null
          marketplace_badge: string | null
          marketplace_excerpt: string | null
          cover_image_url: string | null
          checkout_copy: string | null
          access_message: string | null
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
          marketplace_visible?: boolean | null
          marketplace_badge?: string | null
          marketplace_excerpt?: string | null
          cover_image_url?: string | null
          checkout_copy?: string | null
          access_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }

      orders: {
        Row: {
          id: string
          store_id: string
          buyer_user_id: string | null
          seller_user_id: string | null
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
          buyer_user_id?: string | null
          seller_user_id?: string | null
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
        Relationships: []
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
        Relationships: []
      }

      purchases: {
        Row: {
          id: string
          buyer_user_id: string | null
          buyer_email: string
          product_id: string
          order_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_user_id?: string | null
          buyer_email: string
          product_id: string
          order_id: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
        Relationships: []
      }

      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          customer_email: string
          product_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          amount_cents: number | null
          currency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          customer_email: string
          product_id: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          amount_cents?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }

      // ── V5 Power Upgrade tables ────────────────────────────────────────────

      product_files: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          file_name: string
          file_url: string
          file_type: string
          visibility: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          file_name: string
          file_url: string
          file_type?: string
          visibility?: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_files']['Insert']>
        Relationships: []
      }

      product_updates: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          title: string
          body: string
          link_url: string | null
          link_label: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          title: string
          body?: string
          link_url?: string | null
          link_label?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_updates']['Insert']>
        Relationships: []
      }

      product_reviews: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          customer_name: string
          customer_email: string | null
          rating: number
          message: string
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          customer_name: string
          customer_email?: string | null
          rating: number
          message?: string
          approved?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_reviews']['Insert']>
        Relationships: []
      }

      affiliate_links: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          affiliate_code: string
          affiliate_name: string | null
          affiliate_email: string | null
          commission_pct: number
          enabled: boolean
          total_clicks: number
          total_orders: number
          total_revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          affiliate_code: string
          affiliate_name?: string | null
          affiliate_email?: string | null
          commission_pct?: number
          enabled?: boolean
          total_clicks?: number
          total_orders?: number
          total_revenue?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['affiliate_links']['Insert']>
        Relationships: []
      }

      app_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }

      affiliate_clicks: {
        Row: {
          id: string
          affiliate_link_id: string
          product_id: string
          affiliate_code: string
          order_id: string | null
          referrer_url: string | null
          ip_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_link_id: string
          product_id: string
          affiliate_code: string
          order_id?: string | null
          referrer_url?: string | null
          ip_hash?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['affiliate_clicks']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
