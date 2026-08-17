-- ============================================================
-- 011 — Production Repair: Missing columns + data integrity
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- ── 1. Stores — add missing columns ─────────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS banner_url            text,
  ADD COLUMN IF NOT EXISTS layout_mode           text,
  ADD COLUMN IF NOT EXISTS branding_mode         text NOT NULL DEFAULT 'minimal'
    CHECK (branding_mode IN ('minimal', 'powered_by', 'full_header')),
  ADD COLUMN IF NOT EXISTS support_email         text,
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled     boolean NOT NULL DEFAULT false;

-- ── 2. Products — add missing columns ───────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category                    text,
  ADD COLUMN IF NOT EXISTS marketplace_listing         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_enabled           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_commission_percent integer
    CHECK (affiliate_commission_percent IS NULL OR (affiliate_commission_percent >= 0 AND affiliate_commission_percent <= 100)),
  ADD COLUMN IF NOT EXISTS affiliate_updated_at        timestamptz;

-- ── 3. Product files — add missing columns ───────────────────
ALTER TABLE product_files
  ADD COLUMN IF NOT EXISTS file_size     bigint,
  ADD COLUMN IF NOT EXISTS storage_path  text,
  ADD COLUMN IF NOT EXISTS upload_status text NOT NULL DEFAULT 'complete'
    CHECK (upload_status IN ('pending','uploading','complete','failed'));

-- ── 4. Purchases — add missing columns ──────────────────────
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','revoked','expired')),
  ADD COLUMN IF NOT EXISTS file_id     text;

-- ── 5. Orders — add missing columns ─────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id          text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   text,
  ADD COLUMN IF NOT EXISTS platform_fee_cents         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status              text NOT NULL DEFAULT 'none'
    CHECK (refund_status IN ('none','pending','refunded','partially_refunded','failed')),
  ADD COLUMN IF NOT EXISTS discount_cents             integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency                   text NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS notes                      text,
  ADD COLUMN IF NOT EXISTS product_title_snapshot     text;

-- seller_net_cents computed column (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'seller_net_cents' AND table_schema = 'public'
  ) THEN
    ALTER TABLE orders
      ADD COLUMN seller_net_cents integer GENERATED ALWAYS AS (total_cents - platform_fee_cents) STORED;
  END IF;
END $$;

-- ── 6. Discount codes table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL,
  code            text NOT NULL,
  discount_type   text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  discount_value  integer NOT NULL,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  max_uses        integer,
  used_count      integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "sellers manage own discount codes"
  ON discount_codes FOR ALL
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ── 7. Affiliate tables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_relationships (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid        NOT NULL,
  product_id        uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id         uuid        NOT NULL,
  referral_code     text        NOT NULL,
  source            text        NOT NULL DEFAULT 'manual_join'
    CHECK (source IN ('purchase', 'manual_join')),
  status            text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_user_id, product_id),
  UNIQUE (referral_code)
);
ALTER TABLE affiliate_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "affiliates see own relationships"
  ON affiliate_relationships FOR SELECT USING (affiliate_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "sellers see product relationships"
  ON affiliate_relationships FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY IF NOT EXISTS "authenticated insert affiliate relationship"
  ON affiliate_relationships FOR INSERT WITH CHECK (affiliate_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "sellers update affiliate relationships"
  ON affiliate_relationships FOR UPDATE USING (seller_id = auth.uid());

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id  uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE CASCADE,
  affiliate_user_id uuid       NOT NULL,
  product_id       uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id        uuid        NOT NULL,
  referral_code    text        NOT NULL,
  landing_url      text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "affiliates see own clicks"
  ON affiliate_clicks FOR SELECT USING (affiliate_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "sellers see product clicks"
  ON affiliate_clicks FOR SELECT USING (seller_id = auth.uid());

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id      uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE RESTRICT,
  affiliate_user_id    uuid        NOT NULL,
  seller_id            uuid        NOT NULL,
  product_id           uuid        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id             uuid        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  gross_sale_cents     integer     NOT NULL,
  commission_percent   integer     NOT NULL,
  commission_cents     integer     NOT NULL,
  currency             text        NOT NULL DEFAULT 'usd',
  status               text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  available_at         timestamptz,
  paid_at              timestamptz,
  reversed_at          timestamptz,
  reversal_reason      text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "affiliates see own commissions"
  ON affiliate_commissions FOR SELECT USING (affiliate_user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "sellers see product commissions"
  ON affiliate_commissions FOR SELECT USING (seller_id = auth.uid());

CREATE TABLE IF NOT EXISTS affiliate_attribution (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   text        NOT NULL UNIQUE,
  referral_code   text        NOT NULL,
  relationship_id uuid        NOT NULL REFERENCES affiliate_relationships(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL,
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE affiliate_attribution ENABLE ROW LEVEL SECURITY;

-- ── 8. Orders — affiliate fields ─────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS affiliate_relationship_id uuid REFERENCES affiliate_relationships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_commission_id   uuid;
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS affiliate_relationship_id uuid REFERENCES affiliate_relationships(id) ON DELETE SET NULL;

-- ── 9. Storage buckets ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('store-images',   'store-images',   true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('store-banners',  'store-banners',  true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('product-files',  'product-files',  false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (idempotent)
CREATE POLICY IF NOT EXISTS "store-images read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-images');
CREATE POLICY IF NOT EXISTS "store-images upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-images' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "store-images update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-images' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "store-banners read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-banners');
CREATE POLICY IF NOT EXISTS "store-banners upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-banners' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "product-images read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY IF NOT EXISTS "product-images upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "product-images update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "product-files upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "product-files owner read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');

-- ── 10. Sync store avatar_url from profiles where null ───────
UPDATE stores s
SET avatar_url = p.avatar_url
FROM profiles p
WHERE s.owner_user_id = p.user_id
  AND s.avatar_url IS NULL
  AND p.avatar_url IS NOT NULL;

-- ── 11. Performance indexes ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_marketplace    ON products(marketplace_listing, is_live);
CREATE INDEX IF NOT EXISTS idx_products_category       ON products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_rel_product   ON affiliate_relationships(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_rel_affiliate ON affiliate_relationships(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_rel_seller    ON affiliate_relationships(seller_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_rel_code      ON affiliate_relationships(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_rel    ON affiliate_clicks(relationship_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_aff      ON affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_order    ON affiliate_commissions(order_id);
