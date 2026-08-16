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
          support_email: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          stripe_charges_enabled: boolean
          stripe_payouts_enabled: boolean
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
          support_email?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
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
          product_type?: string
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

      product_files: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number | null
          storage_path: string | null
          upload_status: string
          visibility: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          file_name: string
          file_url?: string
          file_type?: string
          file_size?: number | null
          storage_path?: string | null
          upload_status?: string
          visibility?: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_files']['Insert']>
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
          discount_cents: number
          platform_fee_cents: number
          currency: string
          status: string
          payment_status: string
          refund_status: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          product_title_snapshot: string | null
          product_id: string | null
          notes: string | null
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
          discount_cents?: number
          platform_fee_cents?: number
          currency?: string
          status?: string
          payment_status?: string
          refund_status?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          product_title_snapshot?: string | null
          product_id?: string | null
          notes?: string | null
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
          file_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_user_id?: string | null
          buyer_email: string
          product_id: string
          order_id: string
          file_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
        Relationships: []
      }

      discount_codes: {
        Row: {
          id: string
          store_id: string
          seller_id: string
          code: string
          discount_type: string
          discount_value: number
          product_id: string | null
          max_uses: number | null
          used_count: number
          active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          seller_id: string
          code: string
          discount_type?: string
          discount_value: number
          product_id?: string | null
          max_uses?: number | null
          used_count?: number
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
