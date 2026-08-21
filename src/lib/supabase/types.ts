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
          is_partner: boolean
          show_partner_badge: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_partner?: boolean
          show_partner_badge?: boolean
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
          value_video_url: string | null
          social_links: Record<string, string> | null
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
          value_video_url?: string | null
          social_links?: Record<string, string> | null
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

      store_members: {
        Row: {
          id: string
          store_id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['store_members']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'store_members_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
        ]
      }

      product_ideas: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          title: string
          hook: string | null
          description: string | null
          target_audience: string | null
          category: string | null
          product_type: string | null
          suggested_price_min_cents: number | null
          suggested_price_max_cents: number | null
          primary_keyword: string | null
          supporting_keywords: unknown
          estimated_monthly_searches: number | null
          cpc: number | null
          search_competition: number | null
          trend: string | null
          trend_percent: number | null
          opportunity_score: number | null
          source: string
          why_it_could_sell: string | null
          product_contents: unknown
          source_data: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          title: string
          hook?: string | null
          description?: string | null
          target_audience?: string | null
          category?: string | null
          product_type?: string | null
          suggested_price_min_cents?: number | null
          suggested_price_max_cents?: number | null
          primary_keyword?: string | null
          supporting_keywords?: unknown
          estimated_monthly_searches?: number | null
          cpc?: number | null
          search_competition?: number | null
          trend?: string | null
          trend_percent?: number | null
          opportunity_score?: number | null
          source?: string
          why_it_could_sell?: string | null
          product_contents?: unknown
          source_data?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_ideas']['Insert']>
        Relationships: []
      }

      store_partnerships: {
        Row: {
          id: string
          store_id: string
          created_by_user_id: string
          partner_user_id: string | null
          partner_name: string | null
          partner_email: string | null
          status: string
          internal_notes: string | null
          claimed_at: string | null
          activated_at: string | null
          paused_at: string | null
          current_financial_terms_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          created_by_user_id: string
          partner_user_id?: string | null
          partner_name?: string | null
          partner_email?: string | null
          status?: string
          internal_notes?: string | null
          claimed_at?: string | null
          activated_at?: string | null
          paused_at?: string | null
          current_financial_terms_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['store_partnerships']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'store_partnerships_store_id_fkey'
            columns: ['store_id']
            isOneToOne: true
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
        ]
      }

      partner_shop_invites: {
        Row: {
          id: string
          partnership_id: string
          email: string
          token_hash: string
          expires_at: string
          accepted_at: string | null
          revoked_at: string | null
          created_by_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          partnership_id: string
          email: string
          token_hash: string
          expires_at: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_by_user_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_shop_invites']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'partner_shop_invites_partnership_id_fkey'
            columns: ['partnership_id']
            isOneToOne: false
            referencedRelation: 'store_partnerships'
            referencedColumns: ['id']
          },
        ]
      }

      partner_shop_preview_tokens: {
        Row: {
          id: string
          partnership_id: string
          token_hash: string
          expires_at: string | null
          revoked_at: string | null
          created_by_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          partnership_id: string
          token_hash: string
          expires_at?: string | null
          revoked_at?: string | null
          created_by_user_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_shop_preview_tokens']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'partner_shop_preview_tokens_partnership_id_fkey'
            columns: ['partnership_id']
            isOneToOne: false
            referencedRelation: 'store_partnerships'
            referencedColumns: ['id']
          },
        ]
      }

      partnership_financial_terms: {
        Row: {
          id: string
          partnership_id: string
          version: number
          partner_share_bps: number
          financial_model: string
          split_basis: string
          created_by_user_id: string
          created_at: string
          effective_at: string
          accepted_by_user_id: string | null
          accepted_at: string | null
          superseded_at: string | null
        }
        Insert: {
          id?: string
          partnership_id: string
          version: number
          partner_share_bps: number
          financial_model?: string
          split_basis?: string
          created_by_user_id: string
          created_at?: string
          effective_at?: string
          accepted_by_user_id?: string | null
          accepted_at?: string | null
          superseded_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['partnership_financial_terms']['Insert']>
        Relationships: []
      }

      order_financials: {
        Row: {
          id: string
          order_id: string
          store_id: string
          partnership_id: string
          financial_terms_id: string
          financial_model: string
          currency: string
          sale_subtotal_cents: number
          tax_cents: number
          discount_cents: number
          stripe_fee_cents: number | null
          affiliate_commission_cents: number
          net_distributable_cents: number
          partner_share_bps: number
          partner_share_cents: number
          sellbop_share_cents: number
          transfer_group: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_balance_transaction_id: string | null
          settlement_status: string
          reconciliation_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          store_id: string
          partnership_id: string
          financial_terms_id: string
          financial_model: string
          currency?: string
          sale_subtotal_cents: number
          tax_cents?: number
          discount_cents?: number
          stripe_fee_cents?: number | null
          affiliate_commission_cents?: number
          net_distributable_cents: number
          partner_share_bps: number
          partner_share_cents: number
          sellbop_share_cents: number
          transfer_group: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_balance_transaction_id?: string | null
          settlement_status?: string
          reconciliation_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_financials']['Insert']>
        Relationships: []
      }

      financial_ledger_entries: {
        Row: {
          id: string
          order_id: string
          order_financial_id: string | null
          store_id: string
          partnership_id: string | null
          party_type: string
          party_user_id: string | null
          entry_type: string
          amount_cents: number
          currency: string
          status: string
          stripe_object_id: string | null
          reference: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          order_financial_id?: string | null
          store_id: string
          partnership_id?: string | null
          party_type: string
          party_user_id?: string | null
          entry_type: string
          amount_cents: number
          currency?: string
          status?: string
          stripe_object_id?: string | null
          reference?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['financial_ledger_entries']['Insert']>
        Relationships: []
      }

      partner_transfers: {
        Row: {
          id: string
          order_financial_id: string
          partnership_id: string
          store_id: string
          partner_user_id: string
          amount_cents: number
          currency: string
          status: string
          stripe_transfer_id: string | null
          stripe_transfer_reversal_id: string | null
          idempotency_key: string
          failure_code: string | null
          failure_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_financial_id: string
          partnership_id: string
          store_id: string
          partner_user_id: string
          amount_cents: number
          currency?: string
          status?: string
          stripe_transfer_id?: string | null
          stripe_transfer_reversal_id?: string | null
          idempotency_key: string
          failure_code?: string | null
          failure_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_transfers']['Insert']>
        Relationships: []
      }

      stripe_webhook_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          status: string
          attempt_count: number
          processed_at: string | null
          last_error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          status?: string
          attempt_count?: number
          processed_at?: string | null
          last_error?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stripe_webhook_events']['Insert']>
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
          category: string | null
          marketplace_listing: boolean
          affiliate_enabled: boolean
          affiliate_commission_percent: number | null
          affiliate_updated_at: string | null
          sale_enabled: boolean
          sale_price_cents: number | null
          sale_ends_at: string | null
          sort_order: number
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
          category?: string | null
          marketplace_listing?: boolean
          affiliate_enabled?: boolean
          affiliate_commission_percent?: number | null
          affiliate_updated_at?: string | null
          sale_enabled?: boolean
          sale_price_cents?: number | null
          sale_ends_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }

      affiliate_relationships: {
        Row: {
          id: string
          affiliate_user_id: string
          product_id: string
          seller_id: string
          referral_code: string
          source: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          affiliate_user_id: string
          product_id: string
          seller_id: string
          referral_code: string
          source?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['affiliate_relationships']['Insert']>
        Relationships: []
      }

      affiliate_clicks: {
        Row: {
          id: string
          relationship_id: string
          affiliate_user_id: string
          product_id: string
          seller_id: string
          referral_code: string
          landing_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          relationship_id: string
          affiliate_user_id: string
          product_id: string
          seller_id: string
          referral_code: string
          landing_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['affiliate_clicks']['Insert']>
        Relationships: []
      }

      affiliate_commissions: {
        Row: {
          id: string
          relationship_id: string
          affiliate_user_id: string
          seller_id: string
          product_id: string
          order_id: string
          gross_sale_cents: number
          commission_percent: number
          commission_cents: number
          currency: string
          status: string
          available_at: string | null
          paid_at: string | null
          reversed_at: string | null
          reversal_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          relationship_id: string
          affiliate_user_id: string
          seller_id: string
          product_id: string
          order_id: string
          gross_sale_cents: number
          commission_percent: number
          commission_cents: number
          currency?: string
          status?: string
          available_at?: string | null
          paid_at?: string | null
          reversed_at?: string | null
          reversal_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['affiliate_commissions']['Insert']>
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

      product_media: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          media_type: string
          url: string
          thumbnail_url: string | null
          provider: string
          storage_path: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          media_type: string
          url: string
          thumbnail_url?: string | null
          provider: string
          storage_path?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_media']['Insert']>
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
          refunded_cents: number
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          product_title_snapshot: string | null
          product_id: string | null
          notes: string | null
          fulfillment_provider: string | null
          affiliate_relationship_id: string | null
          affiliate_commission_id: string | null
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
          refunded_cents?: number
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          product_title_snapshot?: string | null
          product_id?: string | null
          notes?: string | null
          fulfillment_provider?: string | null
          affiliate_relationship_id?: string | null
          affiliate_commission_id?: string | null
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
          access_token: string
          affiliate_relationship_id: string | null
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
          access_token?: string
          affiliate_relationship_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
        Relationships: []
      }

      transactional_email_deliveries: {
        Row: {
          id: string
          event_key: string
          email_type: string
          recipient: string
          order_id: string | null
          purchase_id: string | null
          seller_user_id: string | null
          provider: string
          provider_message_id: string | null
          status: string
          attempts: number
          last_error: string | null
          sent_at: string | null
          delivered_at: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_key: string
          email_type: string
          recipient: string
          order_id?: string | null
          purchase_id?: string | null
          seller_user_id?: string | null
          provider?: string
          provider_message_id?: string | null
          status?: string
          attempts?: number
          last_error?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['transactional_email_deliveries']['Insert']>
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

      resource_pages: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          category: string | null
          icon: string | null
          image_url: string | null
          content_json: Json
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          category?: string | null
          icon?: string | null
          image_url?: string | null
          content_json?: Json
          sort_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['resource_pages']['Insert']>
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

      resource_cards: {
        Row: {
          id: string
          page_slug: string
          title: string
          subtitle: string | null
          description: string | null
          icon: string | null
          image_url: string | null
          cta_text: string | null
          cta_url: string | null
          sort_order: number
          is_published: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_slug?: string
          title: string
          subtitle?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          cta_text?: string | null
          cta_url?: string | null
          sort_order?: number
          is_published?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['resource_cards']['Insert']>
        Relationships: []
      }

      seller_onboarding: {
        Row: {
          user_id: string
          dismissed: boolean
          manual_steps: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          dismissed?: boolean
          manual_steps?: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['seller_onboarding']['Insert']>
        Relationships: []
      }

      school_lessons: {
        Row: {
          id: string
          title: string
          original_video_title: string
          creator: string
          youtube_url: string
          youtube_video_id: string
          thumbnail_url: string | null
          duration: string | null
          categories: string[]
          description: string
          why_recommend: string
          featured: boolean
          sort_order: number
          published: boolean
          section_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          original_video_title: string
          creator: string
          youtube_url: string
          youtube_video_id: string
          thumbnail_url?: string | null
          duration?: string | null
          categories?: string[]
          description?: string
          why_recommend?: string
          featured?: boolean
          sort_order?: number
          published?: boolean
          section_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['school_lessons']['Insert']>
        Relationships: []
      }

      school_saved_lessons: {
        Row: {
          user_id: string
          lesson_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          lesson_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['school_saved_lessons']['Insert']>
        Relationships: []
      }

      agent_connections: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          access_mode: string
          provider: string
          name: string
          token_hash: string
          token_prefix: string
          scopes: string[]
          created_at: string
          last_used_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          access_mode?: string
          provider?: string
          name: string
          token_hash: string
          token_prefix: string
          scopes?: string[]
          created_at?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['agent_connections']['Insert']>
        Relationships: []
      }

      oauth_clients: {
        Row: {
          id: string
          client_id: string
          client_name: string | null
          redirect_uris: string[]
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          client_name?: string | null
          redirect_uris?: string[]
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['oauth_clients']['Insert']>
        Relationships: []
      }

      oauth_authorization_codes: {
        Row: {
          code: string
          client_id: string
          user_id: string
          redirect_uri: string
          code_challenge: string
          code_challenge_method: string
          scope: string | null
          used: boolean
          expires_at: string
          created_at: string
          access_mode: string
          store_id: string | null
        }
        Insert: {
          code: string
          client_id: string
          user_id: string
          redirect_uri: string
          code_challenge: string
          code_challenge_method?: string
          scope?: string | null
          used?: boolean
          expires_at: string
          created_at?: string
          access_mode?: string
          store_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['oauth_authorization_codes']['Insert']>
        Relationships: []
      }

      agent_activity_log: {
        Row: {
          id: string
          connection_id: string | null
          user_id: string
          store_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          before: Record<string, unknown> | null
          after: Record<string, unknown> | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id?: string | null
          user_id: string
          store_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          before?: Record<string, unknown> | null
          after?: Record<string, unknown> | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_activity_log']['Insert']>
        Relationships: []
      }

      partner_applications: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          social_links: string
          audience_size: string
          message: string
          status: string
          admin_notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          social_links?: string
          audience_size: string
          message?: string
          status?: string
          admin_notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_applications']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_partner_shop: {
        Args: {
          p_admin_user_id: string
          p_shop_name: string
          p_shop_slug: string
          p_partner_name: string | null
          p_partner_email: string | null
          p_banner_url: string
          p_avatar_url: string | null
        }
        Returns: {
          out_store_id: string
          out_partnership_id: string
        }[]
      }
      claim_partner_shop: {
        Args: {
          p_token_hash: string
          p_user_id: string
          p_user_email: string
        }
        Returns: {
          ok: boolean
          error?: string
          store_id?: string
        }
      }
    }
    Enums: Record<string, never>
  }
}
